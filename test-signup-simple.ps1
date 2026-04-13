$signupBody = @{
    email = 'test@example.com'
    password = 'password123'
    name = 'Test User'
    role = 'student'
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' -Method Post -ContentType 'application/json' -Body $signupBody -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Host "Signup successful. User ID: $($data.user.id)"