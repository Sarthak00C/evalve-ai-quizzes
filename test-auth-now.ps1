$signupBody = @{
    email = 'testuser@example.com'
    password = 'testpass123'
    name = 'Test User'
    role = 'student'
} | ConvertTo-Json

$signupResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' -Method Post -ContentType 'application/json' -Body $signupBody -UseBasicParsing
$signupData = $signupResponse.Content | ConvertFrom-Json

Write-Host "Signup successful. User ID: $($signupData.user.id)"

$signinBody = @{
    email = 'testuser@example.com'
    password = 'testpass123'
} | ConvertTo-Json

$signinResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signin' -Method Post -ContentType 'application/json' -Body $signinBody -UseBasicParsing
$signinData = $signinResponse.Content | ConvertFrom-Json

Write-Host "Signin successful. Token: $($signinData.token.Substring(0,20))..."
