# Source Code Structure

ArcGuardAI is structured into modular Python clinical analysis backend and responsive frontend layers:

```
src/
├── main.py             # Server launcher entry point
├── backend/            # Python clinical protocol analysis & storage engine
│   ├── engine.py       # Deterministic protocol validation & multi-factor risk scoring
│   ├── server.py       # HTTP REST API server with session authentication & CSP
│   ├── store.py        # MongoDB repository for trials, reviews, and audit events
│   ├── seed.py         # Synthetic study dataset generator & default protocol rules
│   ├── auth.py         # Password hashing & session token management
│   └── inject_seed_capas.py # Helper script for seed CAPA quality records
└── frontend/           # Healthcare-grade web interface
    ├── index.html      # Application shell with JetBrains Mono & Material Symbols
    ├── styles.css      # Clinical design system (badges, drawers, timeline, tables)
    ├── app.js          # Client router and 8 clinical views
    └── assets/         # SVG/PNG clinical logos
```

## Running the Application
```bash
# Using root backend runner
python -m backend.server --port 8000

# Or using src launcher
python -m src.main --port 8000
```
