// Tiny vanilla-JS frontend for the todo app.
//
// Imperfection: this script never sends DELETE. The hands-on expects
// the agent to add a 'delete' button per row and wire it up.

const list = document.getElementById("todo-list");
const empty = document.getElementById("empty");
const form = document.getElementById("new-todo");
const titleInput = document.getElementById("title");

async function refresh() {
  const res = await fetch("/todos");
  const todos = await res.json();
  list.innerHTML = "";
  empty.hidden = todos.length > 0;
  for (const t of todos) {
    const li = document.createElement("li");
    if (t.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.done;
    checkbox.addEventListener("change", () => toggle(t.id, checkbox.checked));

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = t.title;

    li.append(checkbox, title);
    list.append(li);
  }
}

async function create(title) {
  await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  await refresh();
}

async function toggle(id, done) {
  await fetch(`/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  await refresh();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  await create(title);
  titleInput.value = "";
});

refresh();
