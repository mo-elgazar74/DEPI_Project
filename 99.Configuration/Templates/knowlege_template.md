<%*
tR = await (async () => {
  const h = tp.user.common_templater_scripts();

  // === 📥 Load options ===
  const allNotes = app.vault.getMarkdownFiles();
  const getFrontmatterType = file => app.metadataCache.getFileCache(file)?.frontmatter?.fileClass || null;

  const projectOptions = allNotes
    .filter(f => getFrontmatterType(f)?.toLowerCase().includes("project"))
    .map(f => f.basename);

  const categoryText = await app.vault.read(await app.vault.getAbstractFileByPath("99.Configuration/Settings/categories.md"));
  const categoryOptions = h.extractList(categoryText);

  const visibilityText = await app.vault.read(await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md"));
  const visibilityOptions = h.extractList(visibilityText);

const membersFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/members.md");
const membersText = await app.vault.read(membersFile);
const authorOptions = h.extractList(membersText);

  const tagsRaw = await h.rePrompt(tp, "🏷️ Tags (comma-separated)", val => /^[\w,\-\s]*$/.test(val), "Tags must be simple words");
  const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  const category = await h.promptSelect(tp, "📂 Knowledge Category", categoryOptions);
  const visibility = await h.promptSelect(tp, "👁️ Visibility", visibilityOptions);
  const project = await h.promptSelect(tp, "📁 Linked project", [...projectOptions], true);
const author = await h.promptSelect(tp, "✍️ Select author", authorOptions);


  const today = tp.date.now("YYYY-MM-DD");
  const description = await h.rePrompt(tp, "📝 Description (min 10 chars)", val => val.length >= 10, "Too short");

  const id = `knowledge-${h.slugify(tp.file.title)}_${h.randomId(4)}`;
  const linkedProject = project ? `[[${project}]]` : "";

  return `---
id: ${id}
fileClass: document
document_type: knowledge
author: ${author}
project: "[[${project}]]"
tags: [${tags.join(", ")}]
category: ${category}
visibility: ${visibility}
created: ${today}
updated: ${today}
archived: false
description: ${description}
linked_docs: []
generated_by: manual
change_logs:
  - "${today}: Knowledge note created."
---

# 📚 ${tp.file.title}

## 📝 Summary

${description}

---

## 🧠 Key Concepts

### Concept 1
- Details

### Concept 2
- Details

---

## 💡 Insights

### Insight 1

### Insight 2

---

## 🧪 Use Cases

### Use case 1

### Use case 2

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

- Add personal commentary, clarifications, or examples here.
`;
})();
%>
