# Lecture Todo App

A small FastAPI todo app with a JSON file backend and a vanilla-JS
frontend. Built to be small, real, and imperfect — the imperfections
are intentional and are what the lecture's hands-on exercises are
designed to find and fix.

## What it does

- List, create, read, update, and delete todos
- Frontend at `http://localhost:8000/`
- API at `http://localhost:8000/todos`
- Data is stored in `data/todos.json` (a single file in the project
  folder — no database)

## Run it

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then open <http://localhost:8000/>
