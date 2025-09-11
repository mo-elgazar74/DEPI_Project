> [!info]+ 🗂️ Kanban Board - visualize tasks grouped by status.

```dataviewjs
const folder = "08.Tasks";
const statuses = ["draft", "in-progress", "blocked", "done", "deprecated", "todo"];
const statusLabels = {
  "draft": "🟡 Draft",
  "in-progress": "🚧 In Progress",
  "blocked": "⛔ Blocked",
  "done": "✅ Done",
  "deprecated": "🗑️ Deprecated"
};
const priorityColors = {
  1: "var(--color-red)",
  2: "var(--color-orange)",
  3: "var(--color-green)"
};

// === FILTERS ===
const selectedProject = dv.current().project_filter ?? null;
const selectedSprint = dv.current().sprint_filter ?? null;

// === LOAD TASKS ===
let tasks = dv.pages(`"${folder}"`).where(p => p.fileClass === "task" && p.status);
if (selectedProject) tasks = tasks.where(p => p.project?.includes(selectedProject));
if (selectedSprint) tasks = tasks.where(p => p.sprint?.includes(selectedSprint));

// === RENDER COLUMNS ===
statuses.forEach(status => {
  const group = tasks.where(t => t.status.toLowerCase() === status);
  if (group.length === 0) return;

  // Create valid <details><summary> structure
  const section = document.createElement("details");
  section.classList.add("kanban-column");
  section.open = true;

  const summary = document.createElement("summary");
  summary.textContent = statusLabels[status] || status;
  section.appendChild(summary);
  dv.container.appendChild(section);

  // === Render cards ===
  group.sort(t => t.priority || 3, "asc")
       .sort(t => t.deadline ?? "", "asc")
       .forEach(task => {
    const card = section.createEl("div", { cls: "kanban-card" });

    // Title + Priority
    const titleRow = card.createEl("div", { cls: "kanban-header" });
    const prio = task.priority || 3;
    const prioBadge = titleRow.createEl("span", {
      text: `P${prio}`,
      cls: "badge priority-badge"
    });
    prioBadge.style.backgroundColor = priorityColors[prio] || "gray";

	const link = titleRow.createEl("a", {
	  text: task.file.name
	});
	link.href = "#";
	link.classList.add("kanban-card-title");
	link.addEventListener("click", (e) => {
	  e.preventDefault();
	  app.workspace.openLinkText(task.file.name, task.file.path, false);
	});
	

    // Task type
    if (task.task_type)
      card.createEl("div", {
        text: `🛠️ ${task.task_type}`,
        cls: "badge task-type-badge"
      });

    // Category
    if (task.category)
      card.createEl("div", {
        text: `📂 ${task.category}`,
        cls: "badge category-badge"
      });

    // Assignee
    card.createEl("div", {
      text: `👤 ${task.assignee ?? "Unassigned"}`,
      cls: "badge assignee-badge"
    });

    // Deadline
    if (task.deadline) {
	const formatted = task.deadline.toFormat("yyyy-MM-dd");

      card.createEl("div", {
        text: `⏳ ${formatted}`,
        cls: "badge deadline-badge"
      });
    }

    // Effort
    const effort = task.effort_in_hours ?? "—";
    const logged = task.logged_efforts_in_hours ?? "0";
    card.createEl("div", {
      text: `⏱️ ${logged}h / ${effort}h`,
      cls: "badge effort-badge"
    });
  });
});

```
> [!tip]+ 👥 Tasks by Assignee
```dataviewjs
const folder = "08.Tasks";
const statusIcons = {
  "draft": "🟡",
  "in-progress": "🚧",
  "blocked": "⛔",
  "done": "✅",
  "deprecated": "🗑️"
};
const priorityColors = {
  1: "var(--color-red)",
  2: "var(--color-orange)",
  3: "var(--color-green)"
};

// === FILTER & GROUP ===
let tasks = dv.pages(`"${folder}"`).where(p => p.fileClass === "task" && p.assignee);
const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))].sort();

assignees.forEach(assignee => {
  const group = tasks.where(t => t.assignee === assignee);
  if (group.length === 0) return;

  const section = document.createElement("details");
  section.classList.add("kanban-column");
  section.open = true;

  const summary = document.createElement("summary");
  summary.textContent = `👤 ${assignee}`;
  section.appendChild(summary);
  dv.container.appendChild(section);

  group.sort(t => t.status || "", "asc")
       .sort(t => t.priority || 3, "asc")
       .sort(t => t.deadline ?? "", "asc")
       .forEach(task => {
    const card = section.createEl("div", { cls: "kanban-card" });

    // Header with Priority + Title
    const titleRow = card.createEl("div", { cls: "kanban-header" });
    const prio = task.priority || 3;
    const prioBadge = titleRow.createEl("span", {
      text: `P${prio}`,
      cls: "badge priority-badge"
    });
    prioBadge.style.backgroundColor = priorityColors[prio] || "gray";
	
	const link = titleRow.createEl("a", {
	  text: task.file.name
	});
	link.href = "#";
	link.classList.add("kanban-card-title");
	link.addEventListener("click", (e) => {
	  e.preventDefault();
	  app.workspace.openLinkText(task.file.name, task.file.path, false);
	});


    // Status badge
    if (task.status) {
      card.createEl("div", {
        text: `${statusIcons[task.status] ?? ""} ${task.status}`,
        cls: "badge status-badge"
      });
    }

    // Task type
    if (task.task_type) {
      card.createEl("div", {
        text: `🛠️ ${task.task_type}`,
        cls: "badge task-type-badge"
      });
    }

    // Category
    if (task.category) {
      card.createEl("div", {
        text: `📂 ${task.category}`,
        cls: "badge category-badge"
      });
    }

console.log("heeey")
    // Deadline
    if (task.deadline) {
	const formatted = task.deadline.toFormat("yyyy-MM-dd");
      card.createEl("div", {
        text: `⏳ ${formatted}`,
        cls: "badge deadline-badge"
      });
    }

    // Effort
    const effort = task.effort_in_hours ?? "—";
    const logged = task.logged_efforts_in_hours ?? "0";
    card.createEl("div", {
      text: `⏱️ ${logged}h / ${effort}h`,
      cls: "badge effort-badge"
    });
  });
});
```
