# datamodel

```json
{"id":"schema","kind":"datamodel","tables":[
 {"node":"users","columns":[{"name":"id","type":"bigint","key":"pk"},{"name":"email","type":"text"}]},
 {"node":"orders","columns":[{"name":"id","type":"uuid","key":"pk"},{"name":"user_id","type":"bigint","key":"fk","ref":"users.id"}]}]}
```

- `ref` draws N:1; `relations: [{"from":"a.x","to":"b.y","kind":"1:1"}]` for others.
- A column with `ref`, or that is a relation's `from`, shows FK, also beside PK when a table shares another's key (1:1). A composite key needs one relation per column.
- `copy: "users.email"` marks a column that stores the same data again (⧉): the page counts the copies and shows where each comes from. `"keep": true`: a copy kept on purpose (price at the time of sale).
- Only the columns that matter.
- `groups: [{"label":"Push side","note":"one database","icon":"database","tables":["push_state","push_log"]}]` frames tables that belong together (a table in one group at most; `note` and `icon` optional). Add them when the user asks to group tables.
