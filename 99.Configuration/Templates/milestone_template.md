<%*
tR = await (async () => {
  const h = tp.user.common_templater_scripts();

  // === 📥 Load options ===
  const allNotes = app.vault.getMarkdownFiles();
  const getFrontmatterType = file => app.metadataCache.getFileCache(file)?.frontmatter?.fileClass || null;

  const projectOptions = allNotes.filter(f => getFrontmatterType(f)?.toLowerCase().includes("project")).map(f => f.basename);
  const milestoneOptions = allNotes.filter(f => getFrontmatterType(f)?.toLowerCase().includes("milestone")).map(f => f.basename);

  const visibilityOptions = h.extractList(await app.vault.read(await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md")));
  const categoryOptions = h.extractList(await app.vault.read(await app.vault.getAbstractFileByPath("99.Configuration/Settings/categories.md")));
  const priorityOptions = h.extractList(await app.vault.read(await app.vault.getAbstractFileByPath("99.Configuration/Settings/priorities.md")));
  const statusOptions = ["draft", "in-progress", "done", "archived"];

  const tagsRaw = await h.rePrompt(tp, "🏷️ Tags (comma-separated)", val => /^[\w,\-\s]*$/.test(val), "Tags must be simple words");
  const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  const project = await tp.system.suggester(["(none)", ...projectOptions], ["", ...projectOptions], true, "📁 Linked project");
  const category = await tp.system.suggester(categoryOptions, categoryOptions, true, "📂 Select category");
  const visibility = await tp.system.suggester(visibilityOptions, visibilityOptions, true, "👁️ Select visibility");
  const priority = await tp.system.suggester(priorityOptions, priorityOptions, true, "⚡ Select priority");
  const status = await tp.system.suggester(statusOptions, statusOptions, false, "📊 Milestone status");

  const today = tp.date.now("YYYY-MM-DD");

  const review_date = await h.rePrompt(tp, "📆 Review date (optional, YYYY-MM-DD)", val => val === "" || h.isValidDate(val), "Invalid date");

  const description = await h.rePrompt(tp, "📝 Description (min 10 chars)", val => val.length >= 10, "Too short");

  const depends_on = await tp.system.suggester(["(none)", ...milestoneOptions], ["", ...milestoneOptions], true, "🔗 Depends on milestone (optional)");

  const id = `milestone-${tp.file.title.toLowerCase().replace(/\s+/g, '-')}_${h.randomId(4)}`;

  return `---
id: ${id}
type: milestone
fileClass: milestone
project: "[[${project}]]"
status: ${status}
tags: [${tags.join(", ")}]
category: ${category}
priority: ${priority}
created: ${today}
updated: ${today}
archived: false
visibility: ${visibility}
description: ${description}
review_date: ${review_date || ""}
depends_on: ${depends_on ? "[[" + depends_on + "]]" : ""}
linked_docs: []
generated_by: manual
change_logs:
  - "${today}: Milestone created."
---

# 🎯 ${tp.file.title}

## 🔍 Overview

${description}

---

## ✅ Epics in this Milestone

\`\`\`dataviewjs
const epics = dv.pages('"08.Epics"')
  .where(e => e.milestone && e.milestone.path === dv.current().file.path)
  .sort(e => e.priority ?? 10, 'asc')
  .sort(e => e.updated, 'desc');

dv.table(
  ["Status", "Priority", "Updated"],
  epics.map(e => [e.status ?? "", e.priority ?? "", e.updated ?? ""])
);
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

- Use this section for milestone scoping, delivery constraints, and risk tracking.
`;
})();
%>
