<%*
tR = await (async () => {
  const h = tp.user.common_templater_scripts();

  // === 📥 Load options ===
  const allNotes = app.vault.getMarkdownFiles();

  function getFrontmatterType(file) {
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.fileClass || null;
  }

  const projectOptions = allNotes
    .filter(f => getFrontmatterType(f)?.toLowerCase().includes("project"))
    .map(f => f.basename);

  const milestoneOptions = allNotes
    .filter(f => getFrontmatterType(f)?.toLowerCase().includes("milestone"))
    .map(f => f.basename);

  const visibilityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md");
  const visibilityText = await app.vault.read(visibilityFile);
  const visibilityOptions = h.extractList(visibilityText);

  const categoryFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/categories.md");
  const categoryText = await app.vault.read(categoryFile);
  const categoryOptions = h.extractList(categoryText);

  const priorityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/priorities.md");
  const priorityText = await app.vault.read(priorityFile);
  const priorityOptions = h.extractList(priorityText);

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
type: epic
fileClass: epic
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
  - "${today}: Epic created."
---

# 📦 ${tp.file.title}

## 🔍 Overview

${description}

---

## ✅ Tasks in this Epic

\`\`\`dataviewjs
const tasks = dv.pages('"08.Tasks"')
  .where(t => t.epic && t.epic.path === dv.current().file.path)
  .sort(t => t.deadline, 'asc');

dv.table(
  ["Status", "Sprint", "Assignee", "Deadline", "Effort", "Logged"],
  tasks.map(t => [
    t.status ?? "",
    t.sprint ?? "",
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
  .where(t => t.epic && t.epic.path === dv.current().file.path);
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

- Use this section for feature scoping, decisions, and retrospectives.
`;
})();
%>