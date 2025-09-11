<%*
tR = await (async () => {
  const h = tp.user.common_templater_scripts();

  // === helpers ===
  const CANCEL = Symbol("CANCEL");
  function must(val) { if (val === null || val === "__cancel__") throw CANCEL; return val; }

  try {
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

    const visibilityFile = await app.vault.getAbstractFileByPath("99.Configuration/Settings/visibility.md");
    const visibilityText = await app.vault.read(visibilityFile);
    const visibilityOptions = h.extractList(visibilityText);

    // === 🧠 User Inputs ===
    const today = tp.date.now("YYYY-MM-DD");

    // cancellable time prompt
    let time;
    while (true) {
      const val = await tp.system.prompt("🕐 Standup time (HH:MM) — press Esc to cancel");
      must(val); // throws if Esc
      if (/^\d{1,2}:\d{2}$/.test(val.trim())) { time = val.trim(); break; }
      new Notice("Must be HH:MM format");
    }

    const project = must(await tp.system.suggester(
      ["(none)", ...projectOptions, "❌ Cancel"],
      ["", ...projectOptions, "__cancel__"],
      true,
      "📁 Linked project"
    ));

    let tagsRaw = must(await tp.system.prompt("🏷️ Tags (comma-separated). Esc to cancel", ""));
    let tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

    // === 👥 Attendees (multi-select, cancellable)
    let attendees = [];
    let done = false;
    while (!done) {
      const choice = await tp.system.suggester(
        [...memberOptions, "✅ Done", "❌ Cancel"],
        [...memberOptions, "__done__", "__cancel__"],
        false,
        `👥 Select attendee #${attendees.length + 1} or '✅ Done'`
      );
      must(choice);
      if (choice === "__done__") {
        if (attendees.length === 0) new Notice("⚠️ At least one attendee required.");
        else done = true;
      } else if (!attendees.includes(choice)) {
        attendees.push(choice);
      } else {
        new Notice("⚠️ Already selected.");
      }
    }

    // === ⚙️ Computed
    const id = `${h.slugify(tp.file.title)}_${h.randomId(4)}`;
    const meetingType = "Standup";
    const description = `Standup Meeting on ${today} at ${time}`;

    // === 📄 Output
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
visibility: internal
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

>[!info]+ 👥 Standup Summary
> **Time:** ${time}  
> **Attendees:** ${attendees.join(", ")}  
> **Project:** ${project || "None"}  
> **Summary:** ${description}

>[!question]+ 🔄 What did we do yesterday?
- [ ] Placeholder

>[!question]+ 🚧 What are we doing today?
- [ ] Placeholder

>[!danger]+ 🛑 Blockers?
- [ ] None reported

>[!check]+ ✅ Follow-ups
- [ ] \`\`\`Tasks/Bug/Fix_XYZ\`\`\`
- [ ] Schedule pairing with [[John]]

>[!tip]+ 📆 Next Standup
Suggested date: \`${tp.date.now("YYYY-MM-DD", +1)}\`

>[!note]+ 🧾 Changelog
> ${today}: Standup created with attendees: ${attendees.join(", ")}.
`;
  } catch (e) {
    if (e === CANCEL) { new Notice("Standup creation canceled."); return ""; }
    throw e;
  }
})();
%>
