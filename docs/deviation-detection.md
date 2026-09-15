# Deviation detection

## What it does
- Compares completed visits against the explicit window, dose, medication and documentation rules.
- Flags absent visit records after the window closes. These need source verification.
- Shows separate data gaps. Unknown values are never marked compliant.
## Input
- Validated visits, protocol and explicit evaluation date.
## Output
- Findings with stable evidence-based IDs, rule reference, expected and observed values, severity and recommended review action.
- IDs include site, participant and event dates. Reassigning a visit cannot reuse another participant's review.
- Dose comparisons use decimal arithmetic so an inclusive fractional tolerance does not create a rounding error.
- Data gaps and pending visits.
## Where used
- Overview, Deviations, Participant Review. GET `/api/analysis`.
## By whom
- CRA, QA and medical reviewer.
## How to test
- Run `python -m unittest discover -s tests -v`.
- Check that a visit exactly three days late is allowed under the demo policy.
## Known limits
- Exact medication names only. No drug dictionary, exposure intervals or interactions.
- Doses use mg only. Multiple findings may exist for one visit.
- These are proposed findings. Clinical significance requires human review.
