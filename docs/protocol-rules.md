# Protocol rules

## What it does
- Stores an explicit, versioned study policy. The default is fictional.
- Major/minor/administrative are sponsor policy labels. They are not a universal ICH scale.
## Input
- JSON with id, version, effectiveDate, visitWindowDays, doseMg, doseToleranceMg, bannedMedications, severity and references.
- All five rule keys must have severity and a source reference.
## Output
- Validated protocol. A new version requires a new version string.
## Where used
- Protocol Rules screen. GET/POST `/api/protocol`.
## By whom
- QA and medical reviewers.
## How to test
- Submit a negative dose or an unknown severity. Expect rejection.
- Change the version and a rule. Refresh analysis and inspect its evidence.
## Known limits
- Only one protocol is active. No automatic PDF extraction or amendment-by-visit selection.
- Visits before the effective date are not evaluable.
- Sponsor approval and clinical validation are required before real use.
