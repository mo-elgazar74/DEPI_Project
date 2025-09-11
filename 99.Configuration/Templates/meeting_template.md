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

  const membersFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/members.md");
  const membersText = await app.vault.read(membersFile);
  const memberOptions = h.extractList(membersText);

  const meetingTypesFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/meeting_types.md");
  const meetingTypesText = await app.vault.read(meetingTypesFile);
  const validMeetingTypes = h.extractList(meetingTypesText);

  const visibilityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md");
  const visibilityText = await app.vault.read(visibilityFile);
  const visibilityOptions = h.extractList(visibilityText);

  // === 🧠 User Inputs with Validation ===
  const today = tp.date.now("YYYY-MM-DD");

  let time;
  do {
    time = await h.rePrompt(tp, "🕐 Meeting time (HH:MM, 24h)", val => /^\d{1,2}:\d{2}$/.test(val), "Must be in HH:MM format");
  } while (!/^\d{1,2}:\d{2}$/.test(time));

  const meetingType = await tp.system.suggester(validMeetingTypes, validMeetingTypes, false, "📂 Meeting type");

  const project = await tp.system.suggester(["(none)", ...projectOptions], ["", ...projectOptions], true, "📁 Linked project");

  let tagsRaw = await h.rePrompt(tp, "🏷️ Tags (comma-separated)", val => /^[\w,\-\s]*$/.test(val), "Tags must be words");
  let tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  const visibility = await tp.system.suggester(visibilityOptions, visibilityOptions, true, "👁️ Select Visibility");

  let description;
  do {
    description = await h.rePrompt(tp, "📝 Description (min 10 chars)", val => val.length >= 10, "Too short");
  } while (description.length < 10);

  // === 👥 Attendees - Multi-select via loop ===
  let attendees = [];
  let done = false;
  while (!done) {
    const choice = await tp.system.suggester(
      [...memberOptions, "✅ Done"],
      [...memberOptions, "__done__"],
      false,
      `👥 Select attendee #${attendees.length + 1} or '✅ Done'`
    );
    if (choice === "__done__") {
      if (attendees.length === 0) new Notice("⚠️ At least one attendee required.");
      else done = true;
    } else if (!attendees.includes(choice)) {
      attendees.push(choice);
    } else {
      new Notice("⚠️ Already selected.");
    }
  }

  // === ⚙️ Computed ===
  const id = `${h.slugify(tp.file.title)}_${h.randomId(4)}`;

  // === 📄 Template Output ===
  return `---
id: ${id}
type: meeting
fileClass: meeting
meetingType: ${meetingType}
project: ${project ? "\"[[" + project + "]]\"" : ""}
tags: [${tags.join(", ")}]
created: ${today}
updated: ${today}
archived: false
visibility: ${visibility}
description: ${description}
date: ${today}
time: "${time}"
attendees: [${attendees.join(", ")}]
linked_tasks: []
linked_epics: []
linked_milestones: []
linked_docs: []
generated_by: manual
---

# 📅 ${tp.file.title}

## 📝 Agenda

- Item 1
- Item 2

## 💬 Discussion Notes

- Point 1
- Point 2

## ✅ Decisions Made

- Decision 1
- Decision 2

## 📌 Action Items

- [ ] \`\`\`Tasks/Bug/Fix_XYZ\`\`\`
- [ ] Follow up on timeline with [[John]]

## 🔄 Follow-up / Next Meeting

- Suggested date: \`YYYY-MM-DD\`

## 🧾 Changelog
### ${today}
- Meeting note created with type \`${meetingType}\` and attendees: ${attendees.join(", ")}.
`;
})();
%>
