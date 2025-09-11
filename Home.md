---
banner: "![[Chatbots.png]]"
---
---
banner: "![[Chatbots.png]]"
banner_y: 0.5
fileClass: dashboard
visibility: internal
banner_x: 0.14987
---
---
# 🏠 Edu_Bot Hub

> [!multi-column]
>
>> [!note]+ 📋 Tasks
>> 
>> `BUTTON[add_task_button]`
>>
>>
>> ```dataview
>> table status, project, priority, deadline
>> from "08.Tasks"
>> where status != "done" and archived != true
>> sort deadline asc
>> limit 5
>> ```
>
>> [!warning]+ 🚧 Projects
>> `BUTTON[add_project_button]`
>>
>>
>> ```dataview
>> table status, priority, deadline
>> from "02.Projects"
>> where archived != true and status != "done"
>> sort priority asc
>> ```

---

> [!multi-column]
>
>> [!calendar]+ 📅 Meetings
>> `BUTTON[create_new_standup]`
>>
>> `BUTTON[create_new_meeting]`
>
>> ```dataview
>> table date, time, meetingType, project, attendees
>> from "03.Meetings"
>> where fileClass = "meeting"
>> sort date desc
>> ```

---

> [!multi-column]
>
>> [!bug]+ 🧱 Epics
>> `BUTTON[create_epic_button]`
>>
>>
>> ```dataview
>> table title, status, owner, deadline
>> from "Epics"
>> where type = "epic"
>> sort deadline asc
>> ```

---

> [!multi-column]
>
>> [!document]+ 📄 Docs
>> `BUTTON[create_document_button]`
>> 
>> ```dataview
>> table author, category, created
>> from "11.Docs"
>> where document_type = "general"
>> sort created desc
>> limit 5
>> ```

---

> [!multi-column]
>
>> [!example]+ 📌 Pinned
>> - [Edu_Bot Studio](Edu_BotStudio.md)
>> - [[Team.canvas|Team]]
>>
>> ```dataview
>> list from "Tasks"
>> where pinned = true
>> ```
>
>> [!quote]+ 🧾 Recent Notes
>>
>> ```dataview
>> list from "Inbox"
>> where created >= date(today) - dur(3 days)
>> sort created desc
>> ```

---

## ➕ Quick Access
