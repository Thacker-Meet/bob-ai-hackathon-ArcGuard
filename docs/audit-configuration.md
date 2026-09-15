# Audit and configuration

## What it does
- Records intake, protocol, review and CAPA mutations in the same transaction as the change.
- Stores the change and audit event in local MongoDB.
- Shows the evaluation date, operating limits and recent change history.
## Input
- Authenticated administrator identity, action and change payload.
## Output
- MongoDB audit records with sequential IDs and UTC timestamps.
## Where used
- Settings. GET `/api/audit`.
## By whom
- QA and administrator.
## How to test
- Save a review and inspect the newest audit entry. Restart the server and check it remains.
## Known limits
- Local MongoDB is not tamper-resistant. This is not a regulated audit trail.
- Loopback only. Cross-origin browser writes are blocked. This does not replace production identity, authorization, encryption, retention controls or validation.
