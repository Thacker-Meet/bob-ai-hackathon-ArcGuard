# Reports and exports

## What it does
- Downloads a full JSON review package and CSV finding register. Provides a printable report view.
## Input
- Current protocol, evaluation date, source data, findings, risk components, CAPAs and recent audit events.
## Output
- `arcguard-review-package.json`, `arcguard-findings.csv`, and browser print output.
- Print shows review status beside finding evidence and plain-English CAPA field labels.
## Where used
- Reports. GET `/api/report` and `/api/export.csv`.
## By whom
- Risk Manager and QA.
## How to test
- Download both formats and compare counts with the dashboard. Print the report using the browser.
## Known limits
- Draft report, not a regulatory submission or approved CAPA.
- CSV contains findings; full CAPAs and source data are in JSON and print view.
- Audit export includes the latest 500 events. Full local history remains in MongoDB.
