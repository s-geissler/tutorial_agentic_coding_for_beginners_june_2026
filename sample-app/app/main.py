"""FastAPI app for the todo sample.

Endpoints:
    GET    /todos         - list all
    POST   /todos         - create one
    GET    /todos/{id}    - read one
    PATCH  /todos/{id}    - update one
    DELETE /todos/{id}    - delete one  (NOT mentioned in the README)

Imperfections, in order of how easy they are to spot:
1. DELETE /todos/{id} returns 204 even when the id doesn't exist.
2. PATCH /todos/{id} accepts extra unknown fields without error.
3. There is no validation that title is non-empty on PATCH.
4. There are no tests for any of the endpoints.
5. The README does not mention the DELETE endpoint.
"""
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from . import storage
from .models import Todo, TodoCreate, TodoUpdate

app = FastAPI(title="Lecture Todo API", version="0.1.0")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def root():
    """Serve the frontend."""
    from fastapi.responses import FileResponse
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/todos", response_model=list[Todo])
def list_endpoint():
    return storage.list_todos()


@app.post("/todos", response_model=Todo, status_code=201)
def create_endpoint(payload: TodoCreate):
    return storage.create_todo(payload.title, payload.description)


@app.get("/todos/{todo_id}", response_model=Todo)
def get_endpoint(todo_id: int):
    todo = storage.get_todo(todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="not found")
    return todo


@app.patch("/todos/{todo_id}", response_model=Todo)
def update_endpoint(todo_id: int, payload: TodoUpdate):
    fields = payload.model_dump(exclude_unset=True)
    todo = storage.update_todo(todo_id, **fields)
    if todo is None:
        raise HTTPException(status_code=404, detail="not found")
    return todo


@app.delete("/todos/{todo_id}", status_code=204)
def delete_endpoint(todo_id: int):
    # Imperfection: 204 on both 'deleted' and 'never existed'.
    storage.delete_todo(todo_id)
    return None
