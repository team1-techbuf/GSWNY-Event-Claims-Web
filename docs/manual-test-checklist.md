# Manual Test Checklist

1. Enable Firebase Auth email/password for the Firebase project.
2. Create a Firebase test user with email/password.
3. Add the same lowercase email to the `Users` tab with `active` set to `TRUE`.
4. Start the Functions emulator with `SHEET_ID` and Google credentials set.
5. Start the Vite frontend with `VITE_API_BASE_URL` pointed at the emulator Function URL.
6. Sign in with the Firebase test user.
7. Verify `/me` displays the approved app user name, email, role, and active status.
8. Verify events load from the `Events` tab joined with `Schools` and active `Claims`.
9. Claim an available volunteer slot.
10. Verify a new active row appears in the `Claims` tab.
11. Attempt the same duplicate claim through the UI or API.
12. Verify the duplicate request returns `409 Conflict`.
13. Cancel the claim.
14. Verify the existing `Claims` row changes to `claim_status` of `cancelled` with `canceled_at` and `cancelled_by`.
15. Sign in as a staff/admin approved user.
16. Verify the Staff tab is visible (and hidden when signed in as a volunteer).
17. Create a draft event, publish it, then confirm it appears for volunteers.
18. Verify the new event row appears in the `Events` tab.
19. Filter the event list by status, zip code, service unit, date, and time block.
20. Confirm an open event within 7 days that needs coverage shows a priority badge and sorts first.
21. From a volunteer's "Me" tab, mark a claimed event completed with a lead-card count and notes; verify `status`, `lead_cards_count`, and `followup_notes` update in the `Events` tab.
22. As staff, use "Notify volunteers" on an uncovered upcoming event; verify the email send (or the console log when SMTP is unset).
23. Verify claim/drop confirmation emails are sent (or logged) to the member.
24. Deploy with Firebase CLI.
25. Add the Hosting URL to `ALLOWED_ORIGINS`; set SMTP secrets for real email.
26. Retest sign in, `/me`, events, claim, cancel, completion, notify, and staff event management on the production URL.
