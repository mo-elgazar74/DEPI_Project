<%*
tR = await (async () => {
  const h = tp.user.common_templater_scripts();

  // === 📥 Lookup ===
  const allNotes = app.vault.getMarkdownFiles();

  function getFrontmatterType(file) {
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.fileClass || null;
  }

  const projectOptions = allNotes
    .filter(f => getFrontmatterType(f)?.toLowerCase().includes("project"))
    .map(f => f.basename);

  const sprintOptions = allNotes
    .filter(f => getFrontmatterType(f)?.toLowerCase().includes("sprint"))
    .map(f => f.basename);

  const epicOptions = allNotes
    .filter(f => getFrontmatterType(f)?.toLowerCase().includes("epic"))
    .map(f => f.basename);

  // === 📥 Inputs ===
const taskTypesFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/task_types.md");
const taskTypesText = await app.vault.read(taskTypesFile);
const validTaskTypes = h.extractList(taskTypesText);
const taskType = await tp.system.suggester(validTaskTypes, validTaskTypes, false, "🔧 Task type");

  const project = await tp.system.suggester(projectOptions, projectOptions, true);
  const epic = epicOptions.length ? await tp.system.suggester(["(none)", ...epicOptions], ["", ...epicOptions]) : "";
  const sprint = sprintOptions.length ? await tp.system.suggester(["(none)", ...sprintOptions], ["", ...sprintOptions]) : "";

  // Status
  const taskStatusFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/task_status.md");
  const taskStatusText = await app.vault.read(taskStatusFile);
  const validTaskStatuses = h.extractList(taskStatusText);
  const status = await tp.system.suggester(validTaskStatuses, validTaskStatuses, false, "✅ Select task status");

  // Tags
  const tagsRaw = await h.rePrompt(tp, "🏷️ Tags (comma-separated)", val => /^[\w,\-\s]*$/.test(val), "Tags must be simple words");
  const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  // Category
  const categoryFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/categories.md");
  const categoryText = await app.vault.read(categoryFile);
  const validCategories = h.extractList(categoryText);
  const category = await tp.system.suggester(validCategories, validCategories, false, "🗂️ Select a category");

  // Priority
  const priorityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/priorities.md");
  const priorityText = await app.vault.read(priorityFile);
  const validPriorities = h.extractList(priorityText);
  const priority = await tp.system.suggester(validPriorities, validPriorities, false, "⚡ Select priority (Lowest is bigger)");

  // Visibility
  const visibilityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md");
  const visibilityContent = await app.vault.read(visibilityFile);
  const visibilityOptions = h.extractList(visibilityContent);
  const visibility = await tp.system.suggester(visibilityOptions, visibilityOptions, true, "👁️ Select Visibility");

  // Description
  const description = await h.rePrompt(tp, "📝 Description (min 10 chars)", val => val.length >= 10, "Too short");

// Deadlines
const deadline = await h.rePrompt(
  tp,
  "⏳ Deadline (YYYY-MM-DD)",
  val => h.isValidDate(val) && new Date(val) >= new Date(tp.date.now("YYYY-MM-DD")),
  "Date must be today or later"
);


// Keep asking until valid soft deadline
let softDeadline;
do {
  softDeadline = await h.rePrompt(
    tp,
    "🧘 Soft Deadline (optional, YYYY-MM-DD)",
    val => val === "" || h.isValidDate(val),
    "Must be YYYY-MM-DD or blank"
  );

  if (softDeadline && new Date(softDeadline) > new Date(deadline)) {
    new Notice("⚠️ Soft deadline must be before or equal to the hard deadline.");
  } else {
    break;
  }
} while (true);

// Validate order
if (softDeadline && new Date(softDeadline) > new Date(deadline)) {
  new Notice("⚠️ Soft deadline must be before or equal to the hard deadline.");
  throw new Error("Invalid soft deadline");
}

  // Effort
const effort = await h.rePrompt(tp, "⏱️ Effort estimate (integer, hours)", val => /^\d+$/.test(val), "Must be a number");
const loggedEffort = await h.rePrompt(tp, "📈 Logged effort (integer, optional)", val => val === "" || /^\d+$/.test(val), "Must be a number or empty");


  // Owner
  const teamFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/teams.md");
  const teamContent = await app.vault.read(teamFile);
  const ownerOptions = h.extractList(teamContent);
  const owner = await tp.system.suggester(ownerOptions, ownerOptions, true, "👤 Select Owner");

//Assignee
const membersFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/members.md");
const membersText = await app.vault.read(membersFile);
const assigneeOptions = h.extractList(membersText);
const assignee = await tp.system.suggester(assigneeOptions, assigneeOptions, true, "👤 Select Assignee");


  // Keywords
  const keywordsRaw = await h.rePrompt(tp, "🔑 Keywords (comma-separated)", val => val.length > 0, "Required");
  const keywords = keywordsRaw.split(",").map(k => k.trim()).filter(Boolean);

  // === 🧪 Processing ===
  const today = tp.date.now("YYYY-MM-DD");
  const slug = h.slugify(tp.file.title);
  const id = `${slug}_${h.randomId(4)}`;

  // === 📄 Output Template ===
  return `---
id: ${id}
fileClass: task
task_type: ${taskType}
project: "[[${project}]]"
epic: ${epic ? "\"[[" +  epic + "]]\"" : ""}
sprint: ${sprint ? "\"[[" +  sprint + "]]\"" : ""}
status: ${status}
tags: [${tags.join(", ")}]
category: ${category}
priority: ${priority}
created: ${today}
updated: ${today}
archived: false
visibility: ${visibility}
description: ${description}
owner: ${owner}
assignee: ${assignee}
deadline: ${deadline}
soft_deadline: ${softDeadline}
effort_in_hours: ${effort}
logged_efforts_in_hours: ${loggedEffort}
linked_tasks: []
linked_docs: []
depends_on: []
keywords: [${keywords.join(", ")}]
generated_by: manual
pinned: false
change_logs:
  - "${today}: Task created."
---

# ✅ ${tp.file.title}

## 🔍 Overview

${description}

## ✅ Progress Tracker

### 🪜 **Steps or Subtasks**

- [ ] placeholder_step

### 💬 **Comments / Progress Updates**

- _No updates yet._

## 🧾 Changelog
\`\`\`dataviewjs
const logs = dv.current().change_logs;
if (Array.isArray(logs) && logs.length > 0) {
  dv.list(logs);
} else {
  dv.paragraph("No changelog entries found.");
}
\`\`\`
`;
})();
%>