$signinBody = @{
    email = 'testuser@example.com'
    password = 'testpass123'
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signin' -Method Post -ContentType 'application/json' -Body $signinBody -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Host "Signin response:"
Write-Host "Status: $($response.StatusCode)"
Write-Host "Token: $($data.token.Substring(0,20))..."
Write-Host "User ID: $($data.user.id)"