# 🚀 ArcGuardAI — Clinical Trial Protocol Risk Intelligence Engine

> Real-time anomaly detection, multi-factor site risk scoring, and automated CAPA management for clinical trial operations.

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | ArcGuard |
| **Track** | AI |
| **Team Lead** | Meet Thacker — thackermeet8127@gmail.com |
| **Members** | Meet Thacker, Yash Patel, Kirtan Kakadiya, Shafin Nigamana |

---

## 🎯 Problem Statement

Clinical trials frequently suffer from unmonitored protocol deviations, dosing errors, visit window delays, and prohibited concomitant medications that jeopardize participant safety and compromise study integrity. Clinical Operations (ClinOps) teams manage massive multi-site studies across fragmented systems, lacking unified leading-indicator risk intelligence to detect site non-compliance before deviations escalate into costly regulatory inspection reprimands or trial failures.

---

## 💡 Solution

ArcGuardAI is an auditable clinical intelligence platform that continuously evaluates synthetic patient visit records against active clinical protocol parameters. It computes multi-dimensional risk scores across research sites, automatically classifies protocol deviations with GCP-grounded root cause evidence, provides deep participant-level longitudinal compliance timelines, and powers an end-to-end Corrective and Preventive Action (CAPA) tracking system across 200+ monitored sites.

---

## ✨ Key Features

- **Automated Protocol Deviation Engine**: Pure-function rule evaluator flagging wrong doses, missed visits, visit window violations, documentation gaps, and prohibited co-medications.
- **Multi-Factor Site Risk Monitor**: Leading-indicator composite risk scoring (0–100) factoring unconfirmed visits, deviation density, overdue queries, staff training gaps, and record staleness.
- **Participant Review & Longitudinal Timeline**: Dedicated patient dossier tracking compliance across 4 clinical domains (Visits, Dosing, Assessments, Medications) with chronological schedule milestones.
- **End-to-End CAPA Quality Management**: Interactive List and Kanban boards tracking root-cause analysis, corrective actions, and effectiveness verification.
- **Auditable Inspection Package**: Full exportable GCP review packages (JSON/CSV), one-click printable regulatory summaries, and an append-only audit trail logging every reviewer action.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python 3.11+, JavaScript (ES6+), HTML5, CSS3 |
| **Frameworks** | Vanilla JS (Zero-dependency fast UI), Python Standard Library HTTP Server |
| **IBM Technologies** | IBM Bob AI Assistant, IBM Cloud Microservices Architecture Pattern |
| **Databases** | MongoDB (Persistent storage for batches, protocol rules, reviews, CAPAs, audit logs) |
| **Design & UI** | Material Symbols Outlined, Inter Font, JetBrains Mono, Custom Teal Clinical Theme |
| **CI/CD & DevOps** | GitHub Actions Workflow, Docker, Automated Submission Validation |

---

## 📁 Repository Structure

```
├── .github/workflows/
│   └── validate.yml       # Submission completeness validation workflow
├── demo/
│   ├── demo-video-link.txt # Demo video link
│   ├── live-demo-url.txt  # Local evaluation instructions
│   └── screenshots/       # UI screenshots across all 8 screens
├── docs/
│   ├── problem-statement.md # Detailed problem statement
│   ├── solution-overview.md # End-to-end solution description
│   ├── architecture.md    # System architecture & Mermaid diagram
│   └── setup-guide.md     # Installation & verification guide
├── presentation/
│   └── README.md          # Slide deck instructions & structure
├── src/
│   ├── main.py            # Primary launcher script
│   ├── backend/           # Clinical risk evaluation engine & API
│   └── frontend/          # Web dashboard interface (8 screens)
├── tests/                 # Automated API and engine unit tests
├── submission.yaml        # Official hackathon metadata
└── README.md              # Project documentation
```

---

## 🚀 Quick Start / How to Run Locally

### 1. Prerequisites
- Python 3.11 or higher
- MongoDB running on `mongodb://localhost:27017`

### 2. Install Dependencies
```bash
python -m pip install pymongo
```

### 3. Launch ArcGuardAI
```bash
# Using the backend runner:
python -m backend.server --port 8000

# Or using the src launcher:
python -m src.main --port 8000
```

### 4. Open the Application
Navigate to **http://127.0.0.1:8000** in your browser.

### 5. Administrator Login
- **Email**: `admin@arcguard.local`
- **Password**: `admin-password-123`

---

## 🧪 Testing & Verification

Run the automated test suite:
```bash
python -m unittest discover -s tests -v
```

All tests execute against an isolated test database, validating rule detection, risk scoring calculations, and protected API endpoints.
