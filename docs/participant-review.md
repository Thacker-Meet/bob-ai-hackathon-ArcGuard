# Participant review

## What it does
- Shows source visits and evidence for a finding. Saves a reasoned review decision.
## Input
- Finding ID, reviewer name, decision and reason.
## Output
- Saved review: under review, confirmed or dismissed. An audit event records the change.
## Where used
- Participant Review dialog from Deviations. POST `/api/reviews`.
## By whom
- CRA, QA and medical reviewer.
## How to test
- Open a finding, enter a reason and save a decision. Reload and confirm persistence.
## Known limits
- Reviewer names are self-entered in local mode. They are not authenticated signatures.
- A dismissed finding remains in source-based risk. Correct the source record to change the measured event.
- Reassigned participants, sites or event dates require fresh review. Historical decisions remain in the audit log.
