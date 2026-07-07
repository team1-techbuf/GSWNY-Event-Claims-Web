import {google, sheets_v4} from "googleapis";
import {
  AppUser,
  ClaimRecord,
  EventRecord,
  EventStatus,
  RowWithNumber,
  School,
  SlotType,
  UserSignup,
  UserRole,
} from "./types";
import {
  normalizeBoolean,
  normalizeEmail,
  parseOptionalNumber,
  requireEnv,
  toSheetBoolean,
} from "./utils";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const SCHOOL_HEADERS = [
  "school_id",
  "ces",
  "county",
  "su_number",
  "school_name",
  "street",
  "city_town",
  "zip_code",
  "notes",
] as const;

const EVENT_HEADERS = [
  "event_id",
  "school_id",
  "event_date",
  "day_of_week",
  "start_time",
  "end_time",
  "time_notes",
  "event_type",
  "arrival_notes",
  "needs_staff",
  "needs_volunteer",
  "status",
  "followup_notes",
  "lead_cards_count",
  "created_by",
  "created_at",
  "updated_at",
] as const;

const CLAIM_REQUIRED_HEADERS = [
  "claim_id",
  "event_id",
  "slot_type",
  "user_email",
  "user_name",
  "claim_status",
  "claimed_at",
  "canceled_at",
  "cancelled_by",
  "cancellation_reason",
] as const;

const USER_HEADERS = [
  "email",
  "phone",
  "full_name",
  "role",
  "active",
  "county",
  "su_number",
  "notes",
] as const;

type SheetObject = Record<string, string>;

interface RawSheetRow {
  rowNumber: number;
  values: SheetObject;
}

export class SheetsService {
  private sheetsClient: sheets_v4.Sheets | null = null;

  async getUsers(): Promise<RowWithNumber<AppUser>[]> {
    const rows = await this.readRows("Users", USER_HEADERS);
    return rows.map(({rowNumber, values}) => ({
      rowNumber,
      email: normalizeEmail(values.email),
      phone: values.phone,
      fullName: values.full_name,
      role: values.role as UserRole,
      active: normalizeBoolean(values.active),
      county: values.county,
      suNumber: values.su_number,
      notes: values.notes,
    }));
  }

  async findUserByEmail(email: string): Promise<RowWithNumber<AppUser> | null> {
    const normalizedEmail = normalizeEmail(email);
    const users = await this.getUsers();
    return users.find((user) => user.email === normalizedEmail) ?? null;
  }

  async ensureSignupUser(signup: UserSignup): Promise<RowWithNumber<AppUser>> {
    const email = normalizeEmail(signup.email);
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }

    const appUser: AppUser = {
      email,
      phone: "",
      fullName: signup.fullName.trim(),
      role: "volunteer",
      active: false,
      county: "",
      suNumber: "",
      notes: "Created from web signup",
    };

    await this.appendRow("Users", USER_HEADERS, userToSheetRow(appUser));
    const createdUser = await this.findUserByEmail(email);
    if (!createdUser) {
      throw new Error("Unable to load newly created user row.");
    }

    return createdUser;
  }

  async getSchools(): Promise<RowWithNumber<School>[]> {
    const rows = await this.readRows("Schools", SCHOOL_HEADERS);
    return rows.map(({rowNumber, values}) => ({
      rowNumber,
      schoolId: values.school_id,
      ces: values.ces,
      county: values.county,
      suNumber: values.su_number,
      schoolName: values.school_name,
      street: values.street,
      cityTown: values.city_town,
      zipCode: values.zip_code,
      notes: values.notes,
    }));
  }

  async getEvents(): Promise<RowWithNumber<EventRecord>[]> {
    const rows = await this.readRows("Events", EVENT_HEADERS);
    return rows.map(({rowNumber, values}) => ({
      rowNumber,
      eventId: values.event_id,
      schoolId: values.school_id,
      eventDate: values.event_date,
      dayOfWeek: values.day_of_week,
      startTime: values.start_time,
      endTime: values.end_time,
      timeNotes: values.time_notes,
      eventType: values.event_type,
      arrivalNotes: values.arrival_notes,
      needsStaff: normalizeBoolean(values.needs_staff),
      needsVolunteer: normalizeBoolean(values.needs_volunteer),
      status: values.status as EventStatus,
      followupNotes: values.followup_notes,
      leadCardsCount: parseOptionalNumber(values.lead_cards_count),
      createdBy: values.created_by,
      createdAt: values.created_at,
      updatedAt: values.updated_at,
    }));
  }

  async appendEvent(event: EventRecord): Promise<void> {
    await this.appendRow("Events", EVENT_HEADERS, eventToSheetRow(event));
  }

  async updateEvent(event: RowWithNumber<EventRecord>): Promise<void> {
    await this.updateRow("Events", EVENT_HEADERS, event.rowNumber, eventToSheetRow(event));
  }

  async getClaims(): Promise<RowWithNumber<ClaimRecord>[]> {
    const rows = await this.readRows("Claims", CLAIM_REQUIRED_HEADERS);
    return rows.map(({rowNumber, values}) => ({
      rowNumber,
      claimId: values.claim_id,
      eventId: values.event_id,
      slotType: values.slot_type as SlotType,
      userEmail: normalizeEmail(values.user_email),
      userName: values.user_name,
      claimStatus: values.claim_status === "cancelled" ? "cancelled" : "active",
      claimedAt: values.claimed_at,
      canceledAt: values.canceled_at,
      cancelledBy: values.cancelled_by ?? "",
      cancelReason: values.cancel_reason || values.cancellation_reason || "",
    }));
  }

  async appendClaim(claim: ClaimRecord): Promise<void> {
    await this.appendRowForExistingHeaders(
      "Claims",
      CLAIM_REQUIRED_HEADERS,
      claimToSheetRow(claim),
    );
  }

  async updateClaim(claim: RowWithNumber<ClaimRecord>): Promise<void> {
    await this.updateRowForExistingHeaders(
      "Claims",
      CLAIM_REQUIRED_HEADERS,
      claim.rowNumber,
      claimToSheetRow(claim),
    );
  }

  private async client(): Promise<sheets_v4.Sheets> {
    if (this.sheetsClient) {
      return this.sheetsClient;
    }

    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE ??
      process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    const credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;
    if (credentials?.private_key) {
      credentials.private_key = String(credentials.private_key).replace(/\\n/g, "\n");
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      keyFile,
      scopes: SCOPES,
    });
    this.sheetsClient = google.sheets({version: "v4", auth});
    return this.sheetsClient;
  }

  private async readRows(
    sheetName: string,
    expectedHeaders: readonly string[],
  ): Promise<RawSheetRow[]> {
    const client = await this.client();
    const response = await client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: quoteSheetRange(sheetName, "A1:ZZ"),
    });
    const values = response.data.values ?? [];
    const headerRow = (values[0] ?? []).map((header) => String(header).trim());

    for (const header of expectedHeaders) {
      if (!headerRow.includes(header)) {
        throw new Error(`Sheet "${sheetName}" is missing required header "${header}"`);
      }
    }

    const keyHeader = expectedHeaders[0];
    return values.slice(1)
      .map((row, index) => ({
        rowNumber: index + 2,
        values: valuesForHeaders(headerRow, row),
      }))
      .filter(({values: rowValues}) =>
        String(rowValues[keyHeader] ?? "").trim() !== "",
      );
  }

  private async readHeaders(
    sheetName: string,
    requiredHeaders: readonly string[],
  ): Promise<string[]> {
    const client = await this.client();
    const response = await client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: quoteSheetRange(sheetName, "1:1"),
    });
    const headerRow = (response.data.values?.[0] ?? [])
      .map((header) => String(header).trim())
      .filter(Boolean);

    for (const header of requiredHeaders) {
      if (!headerRow.includes(header)) {
        throw new Error(`Sheet "${sheetName}" is missing required header "${header}"`);
      }
    }

    return headerRow;
  }

  private async appendRow(
    sheetName: string,
    headers: readonly string[],
    values: SheetObject,
  ): Promise<void> {
    const client = await this.client();
    await client.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: quoteSheetRange(sheetName, `A:${columnName(headers.length)}`),
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [headers.map((header) => values[header] ?? "")],
      },
    });
  }

  private async appendRowForExistingHeaders(
    sheetName: string,
    requiredHeaders: readonly string[],
    values: SheetObject,
  ): Promise<void> {
    const headers = await this.readHeaders(sheetName, requiredHeaders);
    await this.appendRow(sheetName, headers, values);
  }

  private async updateRow(
    sheetName: string,
    headers: readonly string[],
    rowNumber: number,
    values: SheetObject,
  ): Promise<void> {
    const client = await this.client();
    await client.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: quoteSheetRange(sheetName, `A${rowNumber}:${columnName(headers.length)}${rowNumber}`),
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers.map((header) => values[header] ?? "")],
      },
    });
  }

  private async updateRowForExistingHeaders(
    sheetName: string,
    requiredHeaders: readonly string[],
    rowNumber: number,
    values: SheetObject,
  ): Promise<void> {
    const headers = await this.readHeaders(sheetName, requiredHeaders);
    await this.updateRow(sheetName, headers, rowNumber, values);
  }

  private get spreadsheetId(): string {
    return requireEnv("SHEET_ID");
  }
}

function valuesForHeaders(headers: string[], row: unknown[]): SheetObject {
  return headers.reduce<SheetObject>((record, header, index) => {
    record[header] = String(row[index] ?? "").trim();
    return record;
  }, {});
}

function quoteSheetRange(sheetName: string, range: string): string {
  return `'${sheetName.replace(/'/g, "''")}'!${range}`;
}

function columnName(columnCount: number): string {
  let column = "";
  let remaining = columnCount;
  while (remaining > 0) {
    const modulo = (remaining - 1) % 26;
    column = String.fromCharCode(65 + modulo) + column;
    remaining = Math.floor((remaining - modulo) / 26);
  }
  return column;
}

function eventToSheetRow(event: EventRecord): SheetObject {
  return {
    event_id: event.eventId,
    school_id: event.schoolId,
    event_date: event.eventDate,
    day_of_week: event.dayOfWeek,
    start_time: event.startTime,
    end_time: event.endTime,
    time_notes: event.timeNotes,
    event_type: event.eventType,
    arrival_notes: event.arrivalNotes,
    needs_staff: toSheetBoolean(event.needsStaff),
    needs_volunteer: toSheetBoolean(event.needsVolunteer),
    status: event.status,
    followup_notes: event.followupNotes,
    lead_cards_count: event.leadCardsCount === null ? "" : String(event.leadCardsCount),
    created_by: event.createdBy,
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  };
}

function claimToSheetRow(claim: ClaimRecord): SheetObject {
  return {
    claim_id: claim.claimId,
    event_id: claim.eventId,
    slot_type: claim.slotType,
    user_email: normalizeEmail(claim.userEmail),
    user_name: claim.userName,
    claim_status: claim.claimStatus,
    claimed_at: claim.claimedAt,
    canceled_at: claim.canceledAt,
    cancelled_by: normalizeEmail(claim.cancelledBy),
    cancel_reason: claim.cancelReason,
    cancellation_reason: claim.cancelReason,
  };
}

function userToSheetRow(user: AppUser): SheetObject {
  return {
    email: normalizeEmail(user.email),
    phone: user.phone,
    full_name: user.fullName,
    role: user.role,
    active: toSheetBoolean(user.active),
    county: user.county,
    su_number: user.suNumber,
    notes: user.notes,
  };
}
