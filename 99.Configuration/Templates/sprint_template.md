<%*
tR = await (async () => {
  const h = tp.user.common_templater_scripts();

  // === 📥 Load Options ===
  const allNotes = app.vault.getMarkdownFiles();
  const getFrontmatterType = file => app.metadataCache.getFileCache(file)?.frontmatter?.fileClass || null;

  const projectOptions = allNotes.filter(f => getFrontmatterType(f)?.toLowerCase().includes("project")).map(f => f.basename);
  const milestoneOptions = allNotes.filter(f => getFrontmatterType(f)?.toLowerCase().includes("milestone")).map(f => f.basename);

  const visibilityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md");
  const visibilityOptions = h.extractList(await app.vault.read(visibilityFile));

  const categoryFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/categories.md");
  const categoryOptions = h.extractList(await app.vault.read(categoryFile));

  const priorityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/priorities.md");
  const priorityOptions = h.extractList(await app.vault.read(priorityFile));

  // === 📥 Prompts ===
const now = new Date();

// === 📆 Get ISO Week Number ===
function getISOWeek(date) {
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
  const week1 = new Date(temp.getFullYear(), 0, 4);
  return 1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// === 📂 Get Existing Sprint Files ===
const sprintNotes = allNotes.filter(f => f.path.startsWith("07.Sprints/"));

const sprintNames = sprintNotes
  .map(f => f.basename)
  .filter(name => /^Sprint_\d{4}-W\d{2}$/.test(name));

// === 🔢 Extract Year & Week Numbers ===
const parsed = sprintNames
  .map(name => {
    const match = name.match(/^Sprint_(\d{4})-W(\d{2})$/);
    return match ? { year: parseInt(match[1]), week: parseInt(match[2]) } : null;
  })
  .filter(Boolean);

// === 🧠 Determine Next Week (or current if none) ===
let nextYear = now.getFullYear();
let nextWeek = getISOWeek(now);

// If we found existing sprints, suggest the next one
if (parsed.length > 0) {
  parsed.sort((a, b) => (a.year - b.year) || (a.week - b.week));
  const last = parsed[parsed.length - 1];

  // Roll into next year if needed
  nextYear = last.year;
  nextWeek = last.week + 1;
  if (nextWeek > 53) {
    nextWeek = 1;
    nextYear += 1;
  }
}

// Pad week with 0 if needed
const nextSprintName = `Sprint_${nextYear}-W${nextWeek.toString().padStart(2, "0")}`;

// === 📝 Prompt User ===
const sprintName = await tp.system.prompt("📆 Confirm or edit sprint name", nextSprintName);

await tp.file.rename(sprintName);

  const tagsRaw = await h.rePrompt(tp, "🏷️ Tags (comma-separated)", val => /^[\w,\-\s]*$/.test(val), "Tags must be simple words");
  const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  const project = await tp.system.suggester(["(none)", ...projectOptions], ["", ...projectOptions], true, "📁 Linked project");
  const milestone = await tp.system.suggester(["(none)", ...milestoneOptions], ["", ...milestoneOptions], true, "🎯 Linked milestone");
  const category = await tp.system.suggester(categoryOptions, categoryOptions, true, "📂 Select category");
  const priority = await tp.system.suggester(priorityOptions, priorityOptions, true, "⚡ Select priority");
  const visibility = await tp.system.suggester(visibilityOptions, visibilityOptions, true, "👁️ Select visibility");

  const today = tp.date.now("YYYY-MM-DD");
  const description = await h.rePrompt(tp, "📝 Description (min 10 chars)", val => val.length >= 10, "Too short");
  const id = `${h.slugify(tp.file.title)}_${h.randomId(4)}`;

  // === 📄 Template Output ===
  return `---
id: ${id}
type: sprint
fileClass: sprint
project: "[[${project}]]"
status: draft
tags: [${tags.join(", ")}]
category: ${category}
priority: ${priority}
created: ${today}
updated: ${today}
archived: false
visibility: ${visibility}
description: ${description}
milestone: ${milestone ? "[[" + milestone + "]]" : ""}
linked_docs: []
generated_by: manual
change_logs:
  - "${today}: Sprint created."
---

# 🏃 ${tp.file.title}

## 🔍 Overview

${description}

---

## ✅ Tasks in this Sprint

\`\`\`dataviewjs
const tasks = dv.pages('"08.Tasks"')
  .where(t => t.sprint && t.sprint.path === dv.current().file.path)
  .sort(t => t.deadline, 'asc');

dv.table(
  ["Status", "Epic", "Assignee", "Deadline", "Effort", "Logged"],
  tasks.map(t => [
    t.status ?? "",
    t.epic ?? "",
    t.assignee ?? "",
    t.deadline ?? "",
    t.effort_in_hours ?? "",
    t.logged_efforts_in_hours ?? ""
  ])
);
\`\`\`

---

## 📈 Progress

\`\`\`dataviewjs
const allTasks = dv.pages('"08.Tasks"')
  .where(t => t.sprint && t.sprint.path === dv.current().file.path);
const total = allTasks.length;
const done = allTasks.filter(t => (t.status ?? "").toLowerCase() === "done").length;
const pct = total ? Math.round((done / total) * 100) : 0;
dv.paragraph(\`**\${pct}% complete** (\${done}/\${total} tasks)\`);
\`\`\`

---

## 📚 Related Docs

\`\`\`dataviewjs
const docs = dv.current().linked_docs;
if (Array.isArray(docs) && docs.length > 0) {
  dv.list(docs);
} else {
  dv.paragraph("No related docs linked.");
}
\`\`\`

---

## 🧾 Change Log

\`\`\`dataviewjs
const logs = dv.current().change_logs;
if (Array.isArray(logs) && logs.length > 0) {
  dv.list(logs);
} else {
  dv.paragraph("No changelog entries found.");
}
\`\`\`

---

## 💬 Notes

- Add retrospectives, learnings, and improvements here.
`;
})();
%>
