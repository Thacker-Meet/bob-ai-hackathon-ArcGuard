# Test evidence

Verified on 2026-09-15 in Windows with Python 3.12.10 and Node 24.18.0.

## Automated checks

```text
python -m unittest discover -s tests -v
Ran 30 tests in 1.342s
OK

node --check frontend/app.js
Exit code 0

python -m compileall -q backend
Exit code 0
```

Full output: [test-output.txt](test-output.txt).

- Inclusive visit windows on both sides of the scheduled date.
- Missed visits only after the window closes. Future visits stay pending.
- Unknown dose, medications and documentation do not count as compliant.
- Major, minor and administrative example classifications.
- Exact medication matching, inclusive dose tolerance and decimal rounding boundaries.
- Stable evidence IDs. Reassigning a participant, site or event date requires new review.
- Leading signals can raise risk before deviations occur.
- Risk bounds, maximum score, empty site, zero staff and denominator normalization.
- Multiple findings do not double-count the same visit's burden.
- Review decisions preserve source-based risk.
- Valid and invalid dataset intake, protocol versioning and version-reuse rejection.
- Review persistence, guarded CAPA closure, report contents and audit events.
- Malformed input and cross-origin writes are rejected.

## Browser checks

- Opened all navigation screens and the participant evidence dialog.
- Saved a confirmed synthetic medication finding with a reviewer and reason.
- Reopened it and verified the persisted decision and reason.
- Created a draft CAPA with owner, due date and a measurable effectiveness plan.
- Verified the action appeared in CAPA and the report with its evidence.
- Verified both writes appeared in the audit history.
- Filtered major findings for SITE-101. The table returned five matching records.
- Opened SITE-101 risk details. Components were 30 readiness, 20 queries, 15 training, 0 freshness and 25 burden, totaling 90.
- Checked browser error logs: no JavaScript errors reported.
- Checked the dashboard and deviation table at 390 × 844. No page-wide horizontal overflow. The wide table scrolls inside its container.
- Verified Escape closes a dialog. Controls use native labels and visible focus styles.
- Restored the normal desktop viewport after testing.

Desktop evidence: [overview screenshot](evidence/overview-desktop.png).

## Seed result

| Measure | Result |
|---|---:|
| Sites | 204 |
| Visits | 5,304 |
| Proposed findings | 44 |
| Fully evaluable visits | 4,266 |
| Pending visits | 1,020 |
| Visits with data gaps | 18 |
| Compliance among fully evaluable visits | 99.1% |
| Critical / high sites | 2 / 1 |

The date is 2026-09-15 and the protocol is DEMO-ARC-01 v1.0.

## Issues found and fixed

- SQLite connections remained open after transactions. Explicit connection cleanup fixed Windows database-lock cleanup failures.
- A leading-driver label initially included observed burden. It now lists only leading signals.
- A filter label included an adjacent button. The label now closes correctly.
- Finding identity needed site, participant and dates. These are now part of the fingerprint.
- Binary floating-point dose comparisons could misclassify fractional boundaries. Decimal comparisons now handle them exactly.

## Limits of this verification

- No formal clinical validation, security penetration test, screen-reader certification or regulated-system qualification was performed.
- No actual PDF was saved or visually validated; browser print is provided as an output option.
- No real EDC feed or IBM Bob integration was tested.
- Browser workflow test data was preserved in `data/browser-acceptance.sqlite3`. The default working database was refreshed to the original synthetic dataset afterward.
