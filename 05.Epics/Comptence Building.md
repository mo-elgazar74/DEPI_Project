---
id: comptence_building_rba5
type: epic
fileClass: epic
project: "[[02.Projects/Edu_Bot Studio]]"
status: draft
tags:
  - basics
  - learning
  - phase0
category: planning
priority: 1
created: 2025-08-29
updated: 2025-08-29
archived: false
visibility: internal
description: An epic to cover the learning tasks needed for capability ramp up
milestone:
linked_docs: []
generated_by: manual
change_logs:
  - "2025-08-29: Epic created."
---

# 📦 Comptence Building

## 🔍 Overview

An epic to cover the learning tasks needed for capability ramp up


# 📊 Epic Dashboard (KPIs)

```dataviewjs
const tasks = dv.pages('"08.Tasks"')
  .where(t => t.fileClass === "task" && t.epic && t.epic.path === dv.current().file.path);

const tot = tasks.length;
const done = tasks.where(t => (t.status??"").toLowerCase() === "done").length;
const inprog = tasks.where(t => ["doing","in-progress","wip"].includes((t.status??"").toLowerCase())).length;
const open = tot - done - inprog;

const eff = (x)=> Number(x??0);
const totalEff = dv.luxon.Duration.fromObject({ hours: tasks.array().reduce((a,t)=>a+eff(t.effort_in_hours),0) });
const loggedEff = dv.luxon.Duration.fromObject({ hours: tasks.array().reduce((a,t)=>a+eff(t.logged_efforts_in_hours),0) });
const remEffH = Math.max(0, totalEff.as('hours') - loggedEff.as('hours'));
const pct = tot ? Math.round((done/tot)*100) : 0;

const by = (k)=> dv.groupBy(tasks,k).array().sort(g=>g.key);
const overdue = tasks.where(t=> t.deadline && dv.luxon.DateTime.fromISO(t.deadline) < dv.luxon.DateTime.now() && (t.status??"").toLowerCase()!=="done");

dv.el("div", `
<div class="epic-kpis">
  <div class="kpi"><div class="kpi-title">Progress</div><div class="kpi-main">${pct}%</div><div class="kpi-sub">${done}/${tot} tasks</div></div>
  <div class="kpi"><div class="kpi-title">Effort</div><div class="kpi-main">${loggedEff.as('hours').toFixed(1)}/${totalEff.as('hours').toFixed(1)}h</div><div class="kpi-sub">${remEffH.toFixed(1)}h remaining</div></div>
  <div class="kpi"><div class="kpi-title">State</div><div class="kpi-main">${open} open</div><div class="kpi-sub">${inprog} in progress</div></div>
  <div class="kpi"><div class="kpi-title">Risks</div><div class="kpi-main">${overdue.length}</div><div class="kpi-sub">overdue items</div></div>
</div>
<div class="epic-progress"><div class="bar"><div class="fill" style="width:${pct}%"></div></div></div>
`, {cls:"epic-kpis-wrap"});
```


## 🗂️ Kanban Board — by status

```dataviewjs
const cur = dv.current();
const folder = "08.Tasks";
const statuses = ["draft","in-progress","blocked","done","deprecated", "todo"];
const statusLabels = {
  "draft":"🟡 Draft","in-progress":"🚧 In Progress","blocked":"⛔ Blocked","done":"✅ Done","deprecated":"🗑️ Deprecated"
};
const priorityColors = {1:"var(--color-red)",2:"var(--color-orange)",3:"var(--color-green)"};

// optional filters stored on the epic page frontmatter
const selectedProject = cur.project_filter ?? null;
const selectedSprint = cur.sprint_filter ?? null;

// load tasks for this epic only
let tasks = dv.pages(`"${folder}"`).where(p =>
  p.fileClass === "task" &&
  p.epic && p.epic.path === cur.file.path &&
  p.status
);
if (selectedProject) tasks = tasks.where(p => String(p.project??"").includes(selectedProject));
if (selectedSprint) tasks = tasks.where(p => String(p.sprint??"").includes(selectedSprint));

// date formatter that tolerates string/Luxon
const fmtDate = (d) => {
  if (!d) return null;
  if (d?.toFormat) return d.toFormat("yyyy-LL-dd");
  const dt = dv.luxon.DateTime.fromISO(String(d));
  return dt.isValid ? dt.toFormat("yyyy-LL-dd") : null;
};

statuses.forEach(status => {
  const group = tasks.where(t => String(t.status??"").toLowerCase() === status);
  if (group.length === 0) return;

  const section = document.createElement("details");
  section.classList.add("kanban-column");
  section.open = true;

  const summary = document.createElement("summary");
  summary.textContent = statusLabels[status] || status;
  section.appendChild(summary);
  dv.container.appendChild(section);

  group.sort(t => t.priority || 3, "asc")
       .sort(t => t.deadline ?? "", "asc")
       .forEach(task => {
    const card = section.createEl("div", { cls: "kanban-card" });

    const titleRow = card.createEl("div", { cls: "kanban-header" });
    const prio = task.priority || 3;
    const prioBadge = titleRow.createEl("span", { text: `P${prio}`, cls: "badge priority-badge" });
    prioBadge.style.backgroundColor = priorityColors[prio] || "gray";

    const link = titleRow.createEl("a", { text: task.file.name, cls: "kanban-card-title" });
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      app.workspace.openLinkText(task.file.path, task.file.path, false);
    });

    if (task.task_type) card.createEl("div", { text: `🛠️ ${task.task_type}`, cls: "badge task-type-badge" });
    if (task.category)  card.createEl("div", { text: `📂 ${task.category}`, cls: "badge category-badge" });
    card.createEl("div", { text: `👤 ${task.assignee ?? "Unassigned"}`, cls: "badge assignee-badge" });

    const d = fmtDate(task.deadline);
    if (d) card.createEl("div", { text: `⏳ ${d}`, cls: "badge deadline-badge" });

    const effort = task.effort_in_hours ?? "—";
    const logged = task.logged_efforts_in_hours ?? "0";
    card.createEl("div", { text: `⏱️ ${logged}h / ${effort}h`, cls: "badge effort-badge" });
  });
});
```

## 👥 Tasks by Assignee

```dataviewjs
const cur = dv.current();
const folder = "08.Tasks";
const statusIcons = {"draft":"🟡","in-progress":"🚧","blocked":"⛔","done":"✅","deprecated":"🗑️"};
const priorityColors = {1:"var(--color-red)",2:"var(--color-orange)",3:"var(--color-green)"};

// tasks in this epic
let tasks = dv.pages(`"${folder}"`).where(p =>
  p.fileClass === "task" &&
  p.epic && p.epic.path === cur.file.path &&
  p.assignee
);
const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))].sort();

// date formatter
const fmtDate = (d) => {
  if (!d) return null;
  if (d?.toFormat) return d.toFormat("yyyy-LL-dd");
  const dt = dv.luxon.DateTime.fromISO(String(d));
  return dt.isValid ? dt.toFormat("yyyy-LL-dd") : null;
};

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

  group.sort(t => String(t.status??""), "asc")
       .sort(t => t.priority || 3, "asc")
       .sort(t => t.deadline ?? "", "asc")
       .forEach(task => {
    const card = section.createEl("div", { cls: "kanban-card" });

    const titleRow = card.createEl("div", { cls: "kanban-header" });
    const prio = task.priority || 3;
    const prioBadge = titleRow.createEl("span", { text: `P${prio}`, cls: "badge priority-badge" });
    prioBadge.style.backgroundColor = priorityColors[prio] || "gray";

    const link = titleRow.createEl("a", { text: task.file.name, cls: "kanban-card-title" });
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      app.workspace.openLinkText(task.file.path, task.file.path, false);
    });

    const status = String(task.status??"").toLowerCase();
    if (status) card.createEl("div", { text: `${statusIcons[status] ?? ""} ${task.status}`, cls: "badge status-badge" });

    if (task.task_type) card.createEl("div", { text: `🛠️ ${task.task_type}`, cls: "badge task-type-badge" });
    if (task.category)  card.createEl("div", { text: `📂 ${task.category}`, cls: "badge category-badge" });

    const d = fmtDate(task.deadline);
    if (d) card.createEl("div", { text: `⏳ ${d}`, cls: "badge deadline-badge" });

    const effort = task.effort_in_hours ?? "—";
    const logged = task.logged_efforts_in_hours ?? "0";
    card.createEl("div", { text: `⏱️ ${logged}h / ${effort}h`, cls: "badge effort-badge" });
  });
});

```

## 📅 Upcoming deadlines (14 days) 

```dataviewjs
const cur = dv.current();
const all = dv.pages('"08.Tasks"')
  .where(t => t.fileClass === "task" && t.epic && t.epic.path === cur.file.path);

const params = Object.fromEntries(new URLSearchParams(window.location.search));
let filtered = all;
for (const [k,v] of Object.entries(params)) if (v) {
  filtered = filtered.where(t => String(t[k]??"").toLowerCase() === String(v).toLowerCase());
}

const soon = filtered
  .where(t => t.deadline && dv.luxon.DateTime.fromISO(t.deadline) <= dv.luxon.DateTime.now().plus({days:14}))
  .sort(t=>t.deadline);

dv.table(["Task","Assignee","Deadline","Status"], soon.map(t=>[t.file.link??"", t.assignee??"", t.deadline??"", t.status??""]));
```

## 📚 Related Docs

```dataviewjs
const docs = dv.current().linked_docs;
dv.list(Array.isArray(docs)&&docs.length? docs : ["No related docs linked."]);
```

## 🧾 Change Log

```dataviewjs
const logs = dv.current().change_logs;
dv.list(Array.isArray(logs)&&logs.length? logs : ["No changelog entries found."]);
```
## 💬 Notes

- Use this section for feature scoping, decisions, and retrospectives.
