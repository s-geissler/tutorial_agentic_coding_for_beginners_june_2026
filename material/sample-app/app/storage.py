"""JSON file storage for todos.

The store is a tiny class that reads/writes a single JSON file. It is
*not* thread-safe. For the lecture it doesn't matter — the audience is
running it locally and clicking around.
"""
import json
from pathlib import Path
from threading import Lock

from .models import Todo

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "todos.json"
_lock = Lock()


def _load() -> list[dict]:
    with open(DATA_PATH) as f:
        return json.load(f)["todos"]


def _save(todos: list[dict]) -> None:
    with open(DATA_PATH, "w") as f:
        json.dump({"todos": todos}, f, indent=2)


def list_todos() -> list[Todo]:
    return [Todo(**t) for t in _load()]


def get_todo(todo_id: int) -> Todo | None:
    for t in _load():
        if t["id"] == todo_id:
            return Todo(**t)
    return None


def next_id() -> int:
    todos = _load()
    if not todos:
        return 1
    return max(t["id"] for t in todos) + 1


def create_todo(title: str, description: str = "") -> Todo:
    with _lock:
        todos = _load()
        new = {"id": next_id(), "title": title, "description": description, "done": False}
        todos.append(new)
        _save(todos)
        return Todo(**new)


def update_todo(todo_id: int, **fields) -> Todo | None:
    """Update fields on a todo. Returns None if not found.

    Imperfection: if a field is set to its existing value, we still
    rewrite the file. The hands-on expects the agent to find this.
    """
    with _lock:
        todos = _load()
        for t in todos:
            if t["id"] == todo_id:
                for k, v in fields.items():
                    if v is not None:
                        t[k] = v
                _save(todos)
                return Todo(**t)
        return None


def delete_todo(todo_id: int) -> bool:
    """Delete a todo. Returns True if deleted, False otherwise.

    Imperfection: this function silently returns False if the id
    doesn't exist. The API layer also returns 204 in both cases, so
    clients can't tell the difference between 'deleted' and 'never
    existed.' The hands-on expects the agent to spot this.
    """
    with _lock:
        todos = _load()
        for i, t in enumerate(todos):
            if t["id"] == todo_id:
                todos.pop(i)
                _save(todos)
                return True
        return False
