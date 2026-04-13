$body = @{
    email = 'test3@example.com'
    password = 'password123'
    name = 'Test User'
    role = 'student'
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' -Method Post -ContentType 'application/json' -Body $body | Select-Object -ExpandProperty Content
