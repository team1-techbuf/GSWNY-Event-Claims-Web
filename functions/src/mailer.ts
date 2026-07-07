import nodemailer, {Transporter} from "nodemailer";
import {JoinedEvent, SlotType} from "./types";

/**
 * Lightweight email helper.
 *
 * When SMTP credentials are configured through environment variables a real
 * transport is used. Otherwise the message is logged to the Functions console
 * so the app still works end to end in local/dev environments without leaking
 * an SMTP dependency. This keeps notifications best-effort: a mail failure
 * never blocks the underlying claim/drop/event action.
 */

let cachedTransport: Transporter | null | undefined;

function transport(): Transporter | null {
  if (cachedTransport !== undefined) {
    return cachedTransport;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    cachedTransport = null;
    return cachedTransport;
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {user, pass},
  });
  return cachedTransport;
}

function fromAddress(): string {
  return process.env.MAIL_FROM ??
    process.env.SMTP_USER ??
    "GoScouts Events <no-reply@girlscoutswny.org>";
}

interface MailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const recipients = Array.isArray(message.to) ?
    message.to.filter(Boolean) :
    [message.to].filter(Boolean);

  if (recipients.length === 0) {
    return;
  }

  const client = transport();
  if (!client) {
    console.info(
      "[mailer] SMTP not configured; email not sent.",
      JSON.stringify({
        to: recipients,
        subject: message.subject,
      }),
    );
    return;
  }

  try {
    await client.sendMail({
      from: fromAddress(),
      to: recipients.join(", "),
      subject: message.subject,
      text: message.text,
      html: message.html ?? textToHtml(message.text),
    });
  } catch (error) {
    // Notifications are best-effort. Log and continue.
    console.error("[mailer] Failed to send email.", error);
  }
}

export function describeEvent(event: JoinedEvent): string {
  const school = event.school?.schoolName ?? "an event";
  const location = event.school ?
    `${event.school.street}, ${event.school.cityTown} ${event.school.zipCode}`.trim() :
    "";
  const time = [event.startTime, event.endTime].filter(Boolean).join(" - ");
  const lines = [
    `Event: ${event.eventType} at ${school}`,
    `Date: ${event.dayOfWeek ? event.dayOfWeek + ", " : ""}${event.eventDate}`,
    time ? `Time: ${time}` : "",
    location ? `Location: ${location}` : "",
    event.arrivalNotes ? `Arrival notes: ${event.arrivalNotes}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function sendClaimConfirmation(
  to: string,
  userName: string,
  slotType: SlotType,
  event: JoinedEvent,
): Promise<void> {
  const school = event.school?.schoolName ?? "an event";
  await sendMail({
    to,
    subject: `You claimed a ${slotType} slot at ${school}`,
    text: [
      `Hi ${userName || "there"},`,
      "",
      `You have successfully claimed the ${slotType} slot for this event:`,
      "",
      describeEvent(event),
      "",
      "Thank you for supporting Girl Scouts of Western New York!",
      "If you can no longer attend, please drop the slot in the GoScouts app " +
        "so another member can claim it.",
    ].join("\n"),
  });
}

export async function sendDropConfirmation(
  to: string,
  userName: string,
  slotType: SlotType,
  event: JoinedEvent,
): Promise<void> {
  const school = event.school?.schoolName ?? "an event";
  await sendMail({
    to,
    subject: `You dropped a ${slotType} slot at ${school}`,
    text: [
      `Hi ${userName || "there"},`,
      "",
      `Your ${slotType} claim for the following event has been cancelled:`,
      "",
      describeEvent(event),
      "",
      "The slot is now open for another member to claim.",
      "Thank you for letting us know.",
    ].join("\n"),
  });
}

export async function sendVolunteersNeeded(
  recipients: string[],
  event: JoinedEvent,
  note: string,
): Promise<void> {
  const school = event.school?.schoolName ?? "an upcoming event";
  await sendMail({
    to: recipients,
    subject: `Volunteers still needed: ${school}`,
    text: [
      "Hello Girl Scouts volunteers,",
      "",
      "An upcoming event still needs volunteers. Please consider claiming " +
        "a slot in the GoScouts app if you are available.",
      "",
      describeEvent(event),
      note ? `\nMessage from staff:\n${note}` : "",
      "",
      "Thank you for your support!",
    ].filter(Boolean).join("\n"),
  });
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;">${
    escaped.replace(/\n/g, "<br/>")
  }</div>`;
}
