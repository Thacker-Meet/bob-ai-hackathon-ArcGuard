# Setup and Installation Guide

## Prerequisites

Before setting up ArcGuardAI, ensure you have the following installed on your machine:

- **Python 3.11** or newer
- **MongoDB** Community Server running locally on default port (`mongodb://localhost:27017`)
- **Web Browser** (Chrome, Firefox, Safari, or Edge)
- **Git**

---

## Quick Start (Step-by-Step)

### 1. Clone the Repository
```bash
git clone https://github.com/Thacker-Meet/bob-ai-hackathon-ArcGuard.git
cd bob-ai-hackathon-ArcGuard
```

### 2. Set Up Virtual Environment (Optional but Recommended)
```bash
# On Windows
python -m venv venv
.\venv\Scripts\activate

# On Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install pymongo
```

### 4. Ensure MongoDB is Running
```bash
# Verify MongoDB is accessible locally:
# On Linux / macOS:
mongosh --eval "db.adminCommand('ping')"

# On Windows:
# Ensure the MongoDB Windows Service is started
```

### 5. Launch the ArcGuardAI Application
```bash
# Option A (from repository root):
python -m backend.server --port 8000

# Option B (using src launcher):
python -m src.main --port 8000
```

### 6. Access the Application
Open your browser and navigate to:
**http://127.0.0.1:8000**

---

## Default Login Credentials

ArcGuardAI initializes with a local administrator account on first startup:

- **Email**: `admin@arcguard.local`
- **Password**: `admin-password-123`

---

## Running Automated Tests

ArcGuardAI includes a comprehensive test suite covering protocol validation, deviation detection, site risk composite scoring, and authenticated API endpoints:

```bash
python -m unittest discover -s tests -v
```

All test cases run in an isolated test database (`arcguard_test`) to preserve application state.
