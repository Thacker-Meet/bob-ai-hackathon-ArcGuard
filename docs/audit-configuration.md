# Audit and configuration

## What it does
- Records intake, protocol, review and CAPA mutations in the same transaction as the change.
- Closes database connections after every request, including failed transactions.
- Shows the evaluation date, operating limits and recent change history.
## Input
- Actor name, action and change payload.
## Output
- SQLite audit records with sequential IDs and UTC timestamps.
## Where used
- Settings. GET `/api/audit`.
## By whom
- QA and administrator.
## How to test
- Save a review and inspect the newest audit entry. Restart the server and check it remains.
## Known limits
- Local SQLite is not tamper-resistant. Names are self-entered.
- Loopback only. Cross-origin browser writes are blocked. This does not replace production identity, authorization, encryption, retention controls or validation.
