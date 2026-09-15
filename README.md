# ArcGuard Clinical Trial Risk Monitor

ArcGuard compares synthetic patient visits with study rules, highlights protocol deviations, scores research-site risk, and prepares review and CAPA reports. This repository runs locally with MongoDB and requires sign-in before study data is shown.

## Run locally

1. Install Python 3.11+ and start MongoDB on `mongodb://localhost:27017`.
2. From this repository, install the dependency:

   ```powershell
   python -m pip install pymongo
   ```

3. Start the server:

   ```powershell
   python -m backend.server --port 8000
   ```

4. Open <http://127.0.0.1:8000/>.

The app creates the `arcguard` database, sample study data, and a local demo account on first start.

## Administrator login

- Email: `admin@arcguard.local`
- Password: `admin-password-123`

There is no registration screen or public registration API. Local mode creates this single administrator account automatically.

## Main features

- Protocol rule checks for missed visits, visit windows, dose errors, banned medicines, and documentation gaps.
- Major, minor, and administrative deviation classification.
- Leading-indicator site risk scoring.
- Review decisions, CAPA tracking, audit history, and CSV/JSON reports.
- MongoDB persistence for study state, reviews, CAPAs, users, and sessions.

## Test

```powershell
python -m unittest discover -s tests -v
```

The API tests use an isolated MongoDB database, sign in with the demo account, and exercise protected reads and writes. A local MongoDB instance is required.

## Documentation

Feature documents are indexed in [docs/README.md](docs/README.md). Login details are in [docs/login.md](docs/login.md).

## Security limits

This is a local synthetic-data application. The session uses an HttpOnly, SameSite cookie and CSRF token, but production use still needs HTTPS, secret management, account lifecycle controls, rate limiting, and a validated identity provider.
