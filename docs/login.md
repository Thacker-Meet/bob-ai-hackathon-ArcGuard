# Login

## What it does

- Shows a sign-in screen before study data is displayed.
- Checks the email and password in the local MongoDB database.
- Keeps a secure session cookie for eight hours.
- Adds a CSRF token to write requests and provides a Sign out button.

## Input

- `POST /api/auth/login`
- JSON fields: `email`, `password`.
- The seeded local administrator is `admin@arcguard.local` / `admin-password-123`.

## Output

- A session cookie named `arcguard_session`.
- A user object with name and email.
- A CSRF token used by review, CAPA, import, and protocol requests.
- `401` for missing or invalid credentials.

## Where used

- The browser sign-in screen in `frontend/app.js`.
- `GET /api/auth/me` restores an existing session.
- `POST /api/auth/logout` ends the session.

## By whom

- The authorised ArcGuard Administrator. Other personas use the application through controlled administrator access.

## How to test

1. Start MongoDB and the backend.
2. Open `http://127.0.0.1:8000/`.
3. Sign in with the demo account.
4. Confirm the dashboard loads and Sign out returns to the login screen.
5. Run `python -m unittest tests.test_api` and confirm the login is performed before protected API calls.

## Known limits

- There is no registration, password reset, or second user account.
- The administrator account is created automatically for local use.
- MongoDB is local by default; production deployment needs managed secrets, HTTPS, and an identity provider.
