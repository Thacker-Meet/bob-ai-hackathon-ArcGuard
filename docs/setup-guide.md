# Setup guide

## What it does

- Explains how to run ArcGuard locally with MongoDB.
- Provides the single administrator login used by local mode.

## Input

- Python 3.11 or newer.
- A local MongoDB server at `mongodb://localhost:27017`.
- The repository files and bundled `.vendor` dependency folder.

## Output

- ArcGuard at `http://127.0.0.1:8000/`.
- A seeded `arcguard` MongoDB database with sample study data and one administrator account.

## Where used

- Local development, review, and test setup.

## By whom

- Developers, QA reviewers, and evaluators.

## How to test

```powershell
cd D:\IBM-HACKATHON\bob-ai-hackathon-ArcGuard
python -m backend.server --port 8000
```

Open the URL and sign in with:

- Email: `admin@arcguard.local`
- Password: `admin-password-123`

Run the automated checks in another terminal:

```powershell
python -m unittest discover -s tests -v
```

## Known limits

- MongoDB must be running locally.
- There is no registration, password reset, or second account.
- The seeded study data is synthetic and must not be used for clinical decisions.
