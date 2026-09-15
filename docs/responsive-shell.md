# Responsive application shell

## What it does
- Connects Overview, Site Risk, Deviations, Participant Review, CAPA, Reports, Protocol Rules and Settings.
- Uses Stitch's sidebar, light canvas, teal controls, white cards and compact risk tables.
- Uses the user's supplied ArcGuardAI logo in the sidebar. The exact reference PNG is stored in `frontend/assets/arcguard-logo.png` and rendered at its native 200 × 52 size, shrinking proportionally when needed. This preserves the supplied lettering, spacing, shield and colors without font substitution. Alternative text names the logo.
- Adds filters, pagination, evidence dialogs and readable errors.
- Refreshes monitoring views every 30 seconds while visible. Pauses while a dialog or input is active.
- Top-site links filter the site register. The skip link moves keyboard focus to main content.
- Filter labels are separate from action buttons for clear screen-reader names.
## Input
- API responses, search text, site filter and severity filter.
## Output
- Responsive HTML screens with local CSS and JavaScript. No CDN is required.
## Where used
- All screens at `http://127.0.0.1:8000`.
## By whom
- Risk Manager, CRA, Site Coordinator and QA.
## How to test
- Navigate every section. Filter findings, open a dialog and use Escape to close it.
- Use Tab and Shift+Tab. Check visible focus. Resize to a narrow screen.
- Check that the supplied logo loads on desktop and mobile without stretching.
## Known limits
- Local system fonts replace Google fonts. Exact text metrics may differ from Stitch.
- Participant review uses a dialog to retain table context.
- Print output depends on the browser. No external notification, identity provider or IBM Bob integration is configured.
