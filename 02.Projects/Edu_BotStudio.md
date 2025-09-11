---
id: meshkodestudio_qm4z
fileClass: project
status: active
tags:
  - ai
  - backend
  - project
  - core
  - engine
category: project-mgmt
priority: 1
created: 2025-07-06
updated: 2025-07-06
archived: false
visibility: internal
description: Edu_Bot is an Arabic-first, RAG-powered study assistant that helps parents and primary students master the Egyptian curriculum with textbook-grounded answers.
start_date: 2025-07-07
deadline: 2025-10-01
owner: The Wet Sponges
keywords:
  - ai
  - backend
  - main
  - platform
  - native
  - blocks
generated_by: Mohamed Elgazar
---

# Edu_Bot Studio 🧠
## 📝 Overview
---
**Edu_Bot** is an Arabic-first, RAG-powered study assistant that helps parents and primary students master the Egyptian curriculum with textbook-grounded answers.

## ✅ Tasks
```dataviewjs
dv.table(["Title", "Type", "Status", "Owner", "Priority", "Deadline"],
  dv.pages('"08.Tasks"')
    .where(p => p.project && p.project.path === dv.current().file.path && !p.archived)
    .sort(p => p.status, 'asc')
    .sort(p => p.priority, 'asc')
    .map(p => [p.file.link, p.task_type, p.status, p.owner, p.priority, p.deadline])
);
```
---
## 🧾 Changelog
### 2025-09-10
- Project note created with status `active`, owner `The EduBuddies`, and priority `1`.
---
## 🔗 References
* [[Home]]