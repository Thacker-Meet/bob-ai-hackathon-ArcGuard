# P1 Clinical Trial Risk Monitor — implementation plan

## Update plan: local MongoDB and accounts

Written before the database/authentication update.

| Feature | What it does | Input | Output | Where used | By whom |
|---|---|---|---|---|---|
| MongoDB storage | Stores study data, audit history, accounts, and sessions in local MongoDB | MongoDB URI and database name | Persistent MongoDB collections | All APIs and local server startup | Administrator |
| Administrator login and logout | Verifies the single local administrator credential and starts or revokes a session | Administrator email/password; secure random session cookie | Expiring server-side session; signed-in administrator profile | Login screen; auth APIs; header | ArcGuard Administrator |
| Protected workspace | Requires administrator login for study reads, downloads and writes; derives audit identity from the account | Session cookie and CSRF token | Authorized response or 401/403 | All study APIs | ArcGuard Administrator |

Assumptions: this remains a local, single shared study. Only the seeded administrator account can sign in; registration, password recovery, email verification, and persona-specific permissions are outside this increment. Passwords use salted scrypt hashes. Sessions use HttpOnly, SameSite cookies, an absolute expiry and CSRF checks. MongoDB must run locally; there is no silent SQLite fallback.

Written before application code. Product name: ArcGuardAI.

## Feature plan

| Feature | What it does | Input | Output | Where used | By whom |
|---|---|---|---|---|---|
| Protocol rules | Shows and versions explicit study rules. Validates a replacement JSON specification. | JSON: id, version, effectiveDate, visitWindowDays, doseMg, doseToleranceMg, bannedMedications, severity map, references | Versioned protocol JSON and validation errors | Protocol Rules; GET/POST /api/protocol | QA, medical reviewer |
| Record intake | Loads a complete synthetic study or validates a JSON visit batch atomically. | JSON visits: id, participantId, siteId, scheduledDate, actualDate, doseMg, medications, documented, confirmed, updatedAt; site signals | Stored records, intake count, rejected-field errors | Settings; POST /api/import | Site Coordinator, data manager |
| Deviation detection | Compares visit timing, dose, co-medications and documentation with explicit protocol rules. Separates unknown data. | Stored records, protocol, evaluation date | Stable findings: id, rule, evidence, proposed severity, protocol version, review state; data gaps | Overview, Deviations, participant detail; GET /api/analysis | CRA, medical reviewer, QA |
| Site risk | Ranks sites using leading operational signals and normalized deviation burden. Explains every score. | Upcoming unconfirmed visits, overdue queries, incomplete training, record freshness, findings, visit denominators | 0–100 score, band, component values, coverage and counts | Overview, Site Risk; GET /api/analysis | Risk Manager, CRA |
| Participant review | Shows source visit records and rule evidence. Records reviewer decisions with reasons. | Finding ID; reviewer, decision, reason | Persisted review state and audit event | Deviations detail; POST /api/reviews | CRA, QA |
| CAPA management | Creates a draft action plan from a finding and tracks owner, root cause, actions and effectiveness. | Finding ID, owner, dueDate, rootCause, correctiveAction, preventiveAction, effectiveness, status | Persisted CAPA record; guarded closure | CAPA; POST /api/capas | QA, Site Coordinator |
| Reports and exports | Produces CAPA-ready review packages and flat finding exports. | Current analysis, rules, reviews, CAPAs, evaluation date | JSON package, CSV findings, printable HTML through browser | Reports; GET /api/report; GET /api/export.csv | Risk Manager, QA |
| Audit and configuration | Shows local operating limits, score policy and persisted change history. | Intake, protocol change, review and CAPA changes | MongoDB audit events with timestamp, actor and payload | Settings; GET /api/audit | QA, administrator |
| Responsive application shell | Connects all eight reference views with accessible navigation, filters and error states. | API responses; search, site and severity filters | Responsive HTML interface | All screens | All personas |

## Assumptions and clinical boundaries

- No real protocol was supplied. Seed protocol DEMO-ARC-01 is a synthetic example, not a clinical recommendation.
- Demo visit window: plus/minus 3 calendar days, inclusive. A missing actual visit becomes missed only after the upper boundary; before then it is pending.
- Demo dose: 50 mg with zero tolerance. Compare only completed visits with an available dose. Missing fields are unknown, not proof of a deviation.
- The two banned medication names are fictional: DEMO-MED-X and DEMO-MED-Y. Exact case-insensitive token matching only.
- Demo severity policy: wrong dose and banned medication major; missed/out-of-window visits minor; missing documentation administrative. Human review remains required.
- ICH E6(R3) section 3.9.3 requires trial-specific criteria for important deviations. It does not provide this universal three-level mapping. Sponsor approval is needed for a real study.
- Scores are transparent prioritization heuristics, not probabilities or validated predictions. Leading signals contribute 75% and observed deviation burden 25%.
- Seed: 204 sites and 5,304 visits. Evaluation date defaults to 2026-09-15 for repeatable demonstration and can be changed explicitly.
- Dates are calendar dates in the study's assumed UTC calendar. No partial dates, dose units other than mg, treatment interruptions or protocol amendments by visit are inferred.
- This is a runnable local reference implementation. It is not a validated regulated production system. Deployment requires authenticated identities, role authorization, encryption, tamper-resistant audit retention, backup/recovery and formal validation.
- “Bob solution” is interpreted as the requested working application. No IBM Bob runtime, credentials or integration contract was supplied.

## UI review and proposed changes

- Match the exported screens: left rail, trial header, light slate canvas, white bordered cards, teal navigation/actions, red/amber/green risk marks, compact tables and monospace identifiers.
- Use actual computed counts rather than fixed Stitch metrics.
- Replace “Recent Critical Deviations” with “Recent Protocol Deviations”: critical is a site risk band, not a fourth severity.
- Show synthetic-data and human-review notices. Show evaluation date and data coverage so the meaning of risk is visible.
- Add JSON intake, rule version input, evidence dialogs, error messages and empty states to make the mockups functional.
- Use locally available fonts and inline SVG icons so the application runs without CDNs. Exact glyph metrics may differ from Stitch.
- Small screens use a scrollable navigation bar and overflow tables. All actions have text labels, visible focus and semantic controls.

## Architecture and data flow

- Python 3.12 standard library HTTP server + local MongoDB persistence. No build step or external application service is needed.
- Plain JavaScript modules, local CSS and HTML for the frontend. No build step.
- `backend/seed.py` creates deterministic data and the explicit example protocol.
- `backend/engine.py` validates records/rules, detects findings and calculates scores as pure functions.
- `backend/store.py` owns MongoDB collections and audit events.
- `backend/server.py` validates API requests and serves static files on loopback.
- `frontend/app.js` renders navigation, views and workflow forms; `frontend/styles.css` reproduces Stitch's visual language.
- `tests/` exercises boundaries, unknowns, severity, score normalization and API workflows.
- `docs/` holds one simple-English feature document per feature, plus this plan and an index.

## Verification

- Unit tests for inclusive date boundaries, future visits, missing dose/co-medication data, multiple findings, stable IDs and protocol validation.
- Risk tests for empty sites, component bounds, monotonic signals and denominator normalization.
- API integration tests for invalid intake rollback, review persistence, CAPA closure, exports and audit events.
- Browser checks for all screens, filtering, participant review, CAPA creation, reports and mobile layout if browser tooling is available.

## Sources

- [ICH E6(R3), final guideline](https://database.ich.org/sites/default/files/ICH_E6%28R3%29_Step4_FinalGuideline_2025_0106_ErrorCorrections_2025_1024.pdf), sections 3.9 and 3.10.
- [FDA E6(R3) guidance page](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/e6r3-good-clinical-practice-gcp).
