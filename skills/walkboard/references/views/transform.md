# transform

```json
{"id":"data","kind":"transform","stages":[
 {"node":"warehouse","label":"query result","columns":["CUSTOMER_NO","JOINED"],"rows":[["0001042  ","202305"],["0001043",null]],"notes":["all values are text"]},
 {"node":"cronjob","label":"after mapping","columns":["id","joined_at"],"rows":[["0001042","2023-05-01"],["0001043",null]]},
 {"node":"api","label":"request body","text":"{\"items\":[{\"id\":\"0001042\"}]}"}]}
```

Each stage has `columns` + `rows` (rows as long as `columns`) or `text`. Empty and `null` show as `∅`, edge spaces as `␠`.
