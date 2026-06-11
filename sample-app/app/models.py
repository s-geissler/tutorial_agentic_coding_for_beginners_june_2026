"""Pydantic models for the todo API.

Incomplete: TodoUpdate is missing the 'description' field on purpose.
The hands-on exercise expects the agent to notice and fix this.
"""
from pydantic import BaseModel, Field


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""


class TodoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    done: bool | None = None


class Todo(BaseModel):
    id: int
    title: str
    description: str
    done: bool
