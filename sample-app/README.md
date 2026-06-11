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

Then open <http://localhost:8000/>.

## Run the tests

```bash
pytest
```

Only the storage layer is tested. The API endpoints and the frontend
are intentionally not.

## The intentional imperfections

The point of this app is to have real things for the agent to find.
Here's what's wrong on purpose (do not fix these before the lecture):

1. **The `DELETE /todos/{id}` endpoint returns 204 even if the id
   doesn't exist** — clients can't tell "deleted" from "never existed."
   See `app/main.py:48-51`.
2. **The frontend never sends DELETE** — there's no delete button. The
   PATCH-only design means you can mark something done but never
   remove it from the list. See `static/app.js`.
3. **`PATCH /todos/{id}` accepts unknown fields without error** — if
   the client sends `{"foo": "bar"}` it's silently ignored. No
   `extra="forbid"` on the Pydantic model. See `app/models.py:14`.
4. **The storage layer rewrites the whole file on every update** —
   fine at this scale, wrong at any real one.
5. **No tests for the API layer** — `tests/test_storage.py` is the
   only test file. Use `/tdd` to add `tests/test_api.py`.
6. **The README doesn't mention DELETE** — the endpoint exists but
   the docs don't tell you.
