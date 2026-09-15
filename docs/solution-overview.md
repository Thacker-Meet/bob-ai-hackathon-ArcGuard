# Solution Overview

## What We Built

ArcGuardAI is an intelligent, auditable Clinical Trial Protocol Risk Intelligence Engine. It acts as an automated "guardian" for clinical trial operations, continuously screening incoming patient visit batches against active study protocols to detect non-compliance, calculate leading-indicator site risk scores, and orchestrate corrective action plans (CAPA) before issues jeopardize trial success.

## How It Works

ArcGuardAI processes clinical trial operational data through a four-stage reactive intelligence pipeline:

1. **Continuous Protocol Rule Evaluation**: As patient visit records are captured, the pure-function clinical engine validates each visit against active protocol criteria—evaluating exact dose values against tolerances, comparing scheduled dates with visit windows, scanning medication logs against banned substance lists, and flagging missing records.
2. **Deterministic Deviation Classification**: Each detected issue is classified into Major, Minor, or Administrative severity based on protocol-defined thresholds and enriched with explicit expected vs. observed evidence, protocol references, and suggested clinical remediation steps.
3. **Multi-Factor Leading-Indicator Site Scoring**: The system aggregates deviations with operational stress metrics—upcoming unconfirmed visits (30%), deviation density (25%), overdue query backlogs (20%), untrained staff count (15%), and data staleness (10%)—into a calibrated 0–100 composite risk score for every investigative site.
4. **End-to-End CAPA Quality Orchestration**: Reviewers investigate high-risk sites and patient timelines, confirm or dismiss findings with documented rationale, and initiate CAPAs tracked across interactive List and Kanban boards until effectiveness checks pass.

## Architecture Diagram

```
[Clinical Records / EDC]
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     ArcGuardAI Engine                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Protocol Rules Engine │       │ Multi-Factor Scorer   │  │
│  │ (Dose, Meds, Windows) │       │ (Sites 0-100 Rating)  │  │
│  └──────────┬────────────┘       └───────────┬───────────┘  │
│             │                                │              │
│             ▼                                ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Clinical Deviations & CAPA Management Layer          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     [MongoDB Data Store]           [Web Dashboard UI]
   - Study Datasets               - Trial Risk Overview
   - Protocol Versions            - Site Risk Monitor
   - Review Decisions & CAPAs     - Participant Review
   - Append-Only Audit Trail      - CAPA Kanban & Reports
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Pure Function Rule Engine** | Guarantees deterministic, reproducible deviation detection without side effects, crucial for FDA / GCP regulatory validation. |
| **Leading-Indicator Risk Formula** | Prioritizes forward-looking risks (unconfirmed upcoming visits and query backlogs) rather than purely lagging historical counts, enabling proactive intervention. |
| **Zero-Dependency Healthcare UI** | Engineered with vanilla JavaScript, semantic HTML5, and bespoke CSS tokens, ensuring instant sub-second rendering, zero bundle bloat, and maximum reliability across clinical network environments. |
| **Append-Only Immutable Audit Trail** | Every user decision, protocol update, CAPA status transition, and data import is logged with timestamp, actor identity, and change delta satisfying 21 CFR Part 11 requirements. |
| **Longitudinal Patient Dossier** | Clinical monitors need timeline context—seeing that a Visit 3 dose overshoot was an isolated handling error versus a chronic adherence pattern dramatically changes the corrective action required. |

## IBM Technologies & Bob AI Integration

- **IBM Bob AI Assistant**: Used throughout the engineering lifecycle to analyze GCP guideline compliance, synthesize clinical rule structures, generate edge-case validation fixtures, and craft human-centric UI designs tailored for clinical operations professionals.
- **Enterprise Clinical Microservices Architecture**: Designed to align with IBM Cloud Container / Red Hat OpenShift microservices deployment patterns, facilitating future integration with enterprise health data platforms.
