<%*
tR = await (async () => {
  const h = tp.user.common_templater_scripts();
  // === 📥 Inputs ===
  // Status
  const statusFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/project_status.md");
  const statusOptions = h.extractList(await app.vault.read(statusFile));
  const status = await tp.system.suggester(statusOptions, statusOptions, false, "📊 Select Project Status");

  // Tags
  const tagsRaw = await h.rePrompt(tp, "🏷️ Tags (comma-separated)", val => /^[\w,\-\s]*$/.test(val), "Tags must be simple words");
  const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  // Category
  const categoryFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/categories.md");
  const categoryOptions = h.extractList(await app.vault.read(categoryFile));
  const category = await tp.system.suggester(categoryOptions, categoryOptions, false, "🗂️ Select a Category");

  // Priority
  const priorityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/priorities.md");
  const priorityOptions = h.extractList(await app.vault.read(priorityFile));
  const priority = await tp.system.suggester(priorityOptions, priorityOptions, false, "⚡ Select Priority");

  // Visibility
  const visibilityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md");
  const visibilityOptions = h.extractList(await app.vault.read(visibilityFile));
  const visibility = await tp.system.suggester(visibilityOptions, visibilityOptions, true, "👁️ Select Visibility");

  // Description
  const description = await h.rePrompt(tp, "📝 Description (min 10 chars)", val => val.length >= 10, "Too short");

  // Dates
  const startDate = await h.rePrompt(tp, "🛫 Start Date (YYYY-MM-DD)", h.isValidDate, "Invalid format, use YYYY-MM-DD");

  let deadline;
  do {
    deadline = await h.rePrompt(tp, "🏁 Deadline (YYYY-MM-DD)", h.isValidDate, "Invalid format, use YYYY-MM-DD");
    if (h.dateToNumber(startDate) > h.dateToNumber(deadline)) {
      new Notice("❌ Deadline must be after or equal to start date.");
    }
  } while (h.dateToNumber(startDate) > h.dateToNumber(deadline));

  // Owner
  const teamFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/teams.md");
  const ownerOptions = h.extractList(await app.vault.read(teamFile));
  const owner = await tp.system.suggester(ownerOptions, ownerOptions, true, "👤 Select Owner");

  // Keywords
  const keywordsRaw = await h.rePrompt(tp, "🔑 Keywords (comma-separated)", val => val.length > 0, "At least one keyword");
  const keywords = keywordsRaw.split(",").map(k => k.trim()).filter(Boolean);

  // === 🧪 Processing ===
  const today = tp.date.now("YYYY-MM-DD");
  const slug = h.slugify(tp.file.title);
  const id = `${slug}_${h.randomId(4)}`;

  // === 📄 Output Template ===
  return `---
id: ${id}
fileClass: project
status: ${status}
tags: [${tags.join(", ")}]
category: ${category}
priority: ${priority}
created: ${today}
updated: ${today}
archived: false
visibility: ${visibility}
description: ${description}
start_date: ${startDate}
deadline: ${deadline}
owner: ${owner}
keywords: [${keywords.join(", ")}]
generated_by: manual
change_logs:
  - "${today}: Project Created"
---

# ${tp.file.title} 🧠
## 📝 Overview
${description}
---
## ✅ Tasks
\`\`\`dataviewjs
dv.table(["Title", "Type", "Status", "Owner", "Priority", "Deadline"],
  dv.pages('"08.Tasks"')
    .where(p => p.project && p.project.path === dv.current().file.path && !p.archived)
    .sort(p => p.status, 'asc')
    .sort(p => p.priority, 'asc')
    .map(p => [p.file.link, p.task_type, p.status, p.owner, p.priority, p.deadline])
);
\`\`\`
---
## 🧾 Changelog
\`\`\`dataviewjs
const logs = dv.current().change_logs;
if (Array.isArray(logs) && logs.length > 0) {
  dv.list(logs);
} else {
  dv.paragraph("No changelog entries found.");
}
\`\`\`
---
## 🔗 References
* [[Home]]
* [The Wet Sponges](7.Teams/Edu_Bot%20Studio.md)

`;
})();
%>

