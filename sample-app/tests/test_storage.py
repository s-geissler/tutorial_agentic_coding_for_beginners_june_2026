"""Tests for the storage layer only.

No tests for the API endpoints. The hands-on expects the agent to
notice this gap and use the /tdd skill to fill it in.
"""
import pytest
import json
from pathlib import Path

from app import storage


@pytest.fixture
def tmp_data_path(tmp_path, monkeypatch):
    """Redirect storage to a fresh tmp file for each test."""
    fake = tmp_path / "todos.json"
    fake.write_text(json.dumps({"todos": []}))
    monkeypatch.setattr(storage, "DATA_PATH", fake)
    return fake


def test_create_and_list(tmp_data_path):
    t = storage.create_todo("buy milk")
    assert t.id == 1
    assert t.title == "buy milk"
    assert not t.done
    assert len(storage.list_todos()) == 1


def test_update_done(tmp_data_path):
    t = storage.create_todo("read paper")
    updated = storage.update_todo(t.id, done=True)
    assert updated is not None
    assert updated.done is True


def test_update_missing_returns_none(tmp_data_path):
    assert storage.update_todo(999, done=True) is None


def test_delete_existing(tmp_data_path):
    t = storage.create_todo("temp")
    assert storage.delete_todo(t.id) is True
    assert storage.list_todos() == []


def test_delete_missing_returns_false(tmp_data_path):
    assert storage.delete_todo(999) is False
