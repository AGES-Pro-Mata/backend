curl -X 'POST' \
  'http://localhost:3000/auth/signIn' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "ana.costa@university.edu.br",
  "password": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
}'
