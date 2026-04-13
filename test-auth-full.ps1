Write-Host "🧪 Testing complete auth flow..." -ForegroundColor Cyan

# Test 1: Signup
Write-Host "`n📝 Test 1: Signup..."
$signupBody = @{
    email = 'john@example.com'
    password = 'securepass123'
    name = 'John Doe'
    role = 'teacher'
} | ConvertTo-Json

$signupRes = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $signupBody `
    -UseBasicParsing

if ($signupRes.StatusCode -eq 201) {
    $signupData = $signupRes.Content | ConvertFrom-Json
    $token = $signupData.token
    $userId = $signupData.user.id
    
    Write-Host "✅ Signup successful!" -ForegroundColor Green
    Write-Host "   User ID: $userId"
    Write-Host "   Email: $($signupData.user.email)"
    Write-Host "   Name: $($signupData.user.name)"
    Write-Host "   Role: $($signupData.user.role)"
    Write-Host "   Token: $($token.Substring(0,30))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Signup failed with status $($signupRes.StatusCode)" -ForegroundColor Red
    Write-Host $signupRes.Content
    exit 1
}

# Test 2: Signin
Write-Host "`n🔑 Test 2: Signin with same credentials..."
$signinBody = @{
    email = 'john@example.com'
    password = 'securepass123'
} | ConvertTo-Json

$signinRes = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signin' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $signinBody `
    -UseBasicParsing

if ($signinRes.StatusCode -eq 200) {
    $signinData = $signinRes.Content | ConvertFrom-Json
    $token2 = $signinData.token
    
    Write-Host "✅ Signin successful!" -ForegroundColor Green
    Write-Host "   Email: $($signinData.user.email)"
    Write-Host "   Role: $($signinData.user.role)"
    Write-Host "   Token: $($token2.Substring(0,30))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Signin failed with status $($signinRes.StatusCode)" -ForegroundColor Red
    Write-Host $signinRes.Content
    exit 1
}

# Test 3: Get current user (/me)
Write-Host "`n👤 Test 3: Get current user (/me endpoint)..."
$meRes = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/me' `
    -Method Get `
    -ContentType 'application/json' `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -UseBasicParsing

if ($meRes.StatusCode -eq 200) {
    $meData = $meRes.Content | ConvertFrom-Json
    
    Write-Host "✅ /me endpoint successful!" -ForegroundColor Green
    Write-Host "   ID: $($meData.user.id)"
    Write-Host "   Email: $($meData.user.email)"
    Write-Host "   Name: $($meData.user.name)"
    Write-Host "   Role: $($meData.user.role)"
} else {
    Write-Host "❌ /me endpoint failed with status $($meRes.StatusCode)" -ForegroundColor Red
    Write-Host $meRes.Content
    exit 1
}

# Test 4: Wrong password
Write-Host "`n🚫 Test 4: Signin with wrong password (should fail)..."
$wrongPassBody = @{
    email = 'john@example.com'
    password = 'wrongpassword'
} | ConvertTo-Json

try {
    $wrongRes = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signin' `
        -Method Post `
        -ContentType 'application/json' `
        -Body $wrongPassBody `
        -UseBasicParsing `
        -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode.Value -eq 400) {
        Write-Host "✅ Correctly rejected wrong password" -ForegroundColor Green
        $errData = $_.Exception.Response.Content | ConvertFrom-Json
        Write-Host "   Error: $($errData.error)"
    } else {
        Write-Host "❌ Unexpected status code: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ All auth tests passed!" -ForegroundColor Green
