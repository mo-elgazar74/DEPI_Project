## 🎥 `demo`

| **Field**              | **Purpose / Description**               |
| ---------------------- | --------------------------------------- |
| `id`                   | Unique demo ID                          |
| `type`                 | Always `demo`                           |
| `title`                | Short title or purpose                  |
| `project`              | Project this demo belongs to            |
| `status`               | `draft`, `done`, etc.                   |
| `tags`                 | Labels like `internal`, `client`, etc.  |
| `category`             | Domain of demo (e.g. `LLM`, `frontend`) |
| `created`              | When the note was made                  |
| `updated`              | Most recent update                      |
| `archived`             | Visibility control                      |
| `visibility`           | Access: `internal`, `public`, etc.      |
| `description`          | Summary of what was demonstrated        |
| `presented_on` 🟡      | Date of live demo or recording          |
| `linked_tasks` 🟡      | Tasks shown or resulting from demo      |
| `linked_epics` 🟡      | Related initiatives                     |
| `linked_milestones` 🟡 | Release/sprint shown                    |
| `linked_docs` 🟡       | Docs referenced                         |
| `owner` 🟡             | Presenter or creator                    |
| `generated_by` 🟡      | Agent or user who created it            |
