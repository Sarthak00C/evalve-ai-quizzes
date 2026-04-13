Write-Host "Testing complete login flow..." -ForegroundColor Cyan

# Step 1: Create a new user
$email = "logintest@example.com"
$password = "testpass123"

Write-Host "`n1️⃣ Creating user..."
$signupBody = @{
    email = $email
    password = $password
    name = 'Login Test User'
    role = 'student'
} | ConvertTo-Json

$signupRes = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $signupBody `
    -UseBasicParsing

$signupData = $signupRes.Content | ConvertFrom-Json
$userId = $signupData.user.id
$signupToken = $signupData.token

Write-Host "✅ User created: $email (ID: $userId)"

# Step 2: Signin with the same credentials
Write-Host "`n2️⃣ Signing in..."
$signinBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$signinRes = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signin' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $signinBody `
    -UseBasicParsing

$signinData = $signinRes.Content | ConvertFrom-Json
$signinToken = $signinData.token

Write-Host "✅ Signin successful"
Write-Host "  Token matches signup: $($signupToken -eq $signinToken)"

# Step 3: Call /me endpoint
Write-Host "`n3️⃣ Getting current user profile (/me)..."
$meRes = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/me' `
    -Method Get `
    -ContentType 'application/json' `
    -Headers @{ "Authorization" = "Bearer $signinToken" } `
    -UseBasicParsing

$meData = $meRes.Content | ConvertFrom-Json

Write-Host "✅ Current user retrieved:"
Write-Host "  ID: $($meData.user.id)"
Write-Host "  Email: $($meData.user.email)"
Write-Host "  Name: $($meData.user.name)"
Write-Host "  Role: $($meData.user.role)"

if ($meData.user.id -eq $userId) {
    Write-Host "`n✅ LOGIN FLOW WORKING! User ID matches."
} else {
    Write-Host "`n❌ ERROR: User ID mismatch!"
    exit 1
}
