# Execution flow

1. `python -m backend.server` calls `make_server`.
2. `Store` creates SQLite tables. It calls `make_seed` only when the database has no study.
3. The browser loads `frontend/index.html`, `styles.css` and `app.js` from local routes.
4. `app.js` calls `/api/analysis` and `/api/data` together.
5. `Handler.analysis` reads a consistent store snapshot, then calls `engine.analyze`.
6. `analyze` calls `evaluate_visit` for every record. It groups findings and calls `score_site` for every site.
7. The browser renders one of seven navigation screens. Participant Review is the eighth view, opened as an evidence dialog.
8. A review or CAPA form posts JSON. The server starts a write transaction, checks current finding evidence, validates the request, saves it and appends an audit event.
9. The browser fetches fresh analysis after the write. Errors remain visible in the form.
10. Reports use the same analysis engine as the dashboard. CSV escapes possible spreadsheet formulas. JSON includes source records and CAPA evidence snapshots.

## Changes made in this build

- Created the entire path above in a previously empty workspace.
- Added pure-function tests before browser verification.
- Added invalid-input and workflow tests against temporary HTTP servers and databases.

## Boundaries to understand

- Current protocol only. Old versions are audit history, not automatic visit-level routing.
- Current records evaluated at a selected date. No historical snapshot reconstruction.
- Monitoring views poll every 30 seconds. Active forms and dialogs are not replaced. No EDC push feed or scheduled ingestion is configured.
