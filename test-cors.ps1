$headers = @{
    'Content-Type' = 'application/json'
    'Origin' = 'http://localhost:5174'
}

$body = '{"email":"test@example.com","password":"password123"}'

$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signin' -Method Post -Headers $headers -Body $body -UseBasicParsing
$response.Content