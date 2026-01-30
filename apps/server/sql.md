# 部分 SQL

```
psql -h localhost -U olive -d chunkflow -c "
SELECT
  COUNT(*) as file_chunk_relations
FROM file_chunks
WHERE file_id = 'e53bfbb50ce361d03aba3b945080ea89';
"
```
