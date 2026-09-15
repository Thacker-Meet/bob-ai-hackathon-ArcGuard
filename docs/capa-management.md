# CAPA management

## What it does
- Links an action plan to the finding and its original evidence.
- Tracks ownership, cause investigation, correction, prevention and effectiveness.
## Input
- Finding ID, owner, due date, root cause, corrective action, preventive action, effectiveness plan and status.
- Closing requires closure evidence and a confirmed finding.
## Output
- A saved CAPA record and audit event. The report includes the full record.
## Where used
- CAPA screen and participant dialog. POST `/api/capas`.
## By whom
- QA and Site Coordinator.
## How to test
- Create a draft. Attempt closure without evidence. Expect rejection.
- Confirm the finding, enter evidence and close the action.
## Known limits
- Recommendations are drafts. No automatic diagnosis, drug change or clinical order is made.
- No electronic signatures or independent approver enforcement.
- A CAPA whose source finding changed remains in the log with its evidence snapshot; it cannot be updated against a stale finding.
