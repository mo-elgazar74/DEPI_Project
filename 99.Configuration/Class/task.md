---
fields:
  - name: id
    type: Input
    options:
      template: "{{ID}}"
    path: ""
    id: sXyP1z
  - name: task_type
    type: Select
    options:
      sourceType: ValuesListNotePath
      valuesList: {}
      valuesListNotePath: 99.Configuration/Settings/task_types.md
    path: ""
    id: rT3kLm
  - name: project
    type: File
    options:
      dvQueryString: dv.pages('"02.Projects"')
    path: ""
    id: Q2wE9o
  - name: epic
    type: File
    options:
      dvQueryString: dv.pages('"06.Epics"')
    path: ""
    id: Vb8N6c
  - name: sprint
    type: File
    options:
      dvQueryString: dv.pages('"07.Sprints"')
    path: ""
    id: pL0T4d
  - name: status
    type: Select
    options:
      sourceType: ValuesListNotePath
      valuesList: {}
      valuesListNotePath: 99.Configuration/Settings/task_status.md
    path: ""
    id: hG7jKq
  - name: tags
    type: Input
    options: {}
    path: ""
    id: aR3yUc
  - name: category
    type: Select
    options:
      sourceType: ValuesListNotePath
      valuesList: {}
      valuesListNotePath: 99.Configuration/Settings/categories.md
    path: ""
    id: Z8fXs2
  - name: priority
    type: Select
    options:
      sourceType: ValuesListNotePath
      valuesList: {}
      valuesListNotePath: 99.Configuration/Settings/priorities.md
    path: ""
    id: mD5cHv
  - name: created
    type: Date
    options:
      dateShiftInterval: 1 day
      dateFormat: YYYY-MM-DD
      defaultInsertAsLink: false
      linkPath: ""
    path: ""
    id: cK9MqR
  - name: updated
    type: Date
    options:
      dateShiftInterval: 1 day
      dateFormat: YYYY-MM-DD
      defaultInsertAsLink: false
      linkPath: ""
    path: ""
    id: eP1LzB
  - name: archived
    type: Boolean
    options: {}
    path: ""
    id: wX4fGh
  - name: visibility
    type: Select
    options:
      sourceType: ValuesListNotePath
      valuesList: {}
      valuesListNotePath: 99.Configuration/Settings/visibility.md
    path: ""
    id: nS6pQj
  - name: description
    type: Input
    options: {}
    path: ""
    id: F5bGwT
  - name: owner
    type: Select
    options:
      sourceType: ValuesListNotePath
      valuesList: {}
      valuesListNotePath: 99.Configuration/Settings/teams.md
    path: ""
    id: uC2rVa
  - name: deadline
    type: Date
    options:
      dateShiftInterval: 1 day
      dateFormat: YYYY-MM-DD
      defaultInsertAsLink: false
      linkPath: ""
    path: ""
    id: oH3zLj
  - name: soft_deadline
    type: Date
    options:
      dateShiftInterval: 1 day
      dateFormat: YYYY-MM-DD
      defaultInsertAsLink: false
      linkPath: ""
    path: ""
    id: yN7dKx
  - name: effort_in_hours
    type: Number
    options:
      step: 1
      min: 0
      max: 300
    path: ""
    id: gQ4mSe
  - name: logged_efforts_in_hours
    type: Number
    options:
      step: 1
      min: 0
      max: 300
    path: ""
    id: D6tPaU
  - name: linked_tasks
    type: Multi
    options:
      sourceType: ValuesList
      valuesList: {}
    path: ""
    id: kJ8rFw
  - name: linked_docs
    type: Multi
    options:
      sourceType: ValuesList
      valuesList: {}
    path: ""
    id: R9yBsE
  - name: depends_on
    type: Multi
    options:
      sourceType: ValuesList
      valuesList: {}
    path: ""
    id: H1qTrZ
  - name: keywords
    type: Multi
    options:
      sourceType: ValuesList
      valuesList: {}
    path: ""
    id: L4vOxS
  - name: generated_by
    type: Input
    options: {}
    path: ""
    id: P2cWfD
  - name: pinned
    type: Boolean
    options: {}
    path: ""
    id: B7jPnM
  - name: assignee
    type: Select
    options:
      sourceType: ValuesListNotePath
      valuesList: {}
      valuesListNotePath: 99.Configuration/Settings/members.md
    path: ""
    id: sYRgrz
version: "2.180"
limit: 20
mapWithTag: false
icon: check-square
tagNames: 
filesPaths: 
bookmarksGroups: 
excludes: 
extends: 
savedViews: []
favoriteView: 
fieldsOrder:
  - sXyP1z
  - rT3kLm
  - Q2wE9o
  - Vb8N6c
  - pL0T4d
  - hG7jKq
  - aR3yUc
  - Z8fXs2
  - mD5cHv
  - cK9MqR
  - eP1LzB
  - wX4fGh
  - nS6pQj
  - F5bGwT
  - uC2rVa
  - sYRgrz
  - oH3zLj
  - yN7dKx
  - gQ4mSe
  - D6tPaU
  - kJ8rFw
  - R9yBsE
  - H1qTrZ
  - L4vOxS
  - P2cWfD
  - B7jPnM
---
