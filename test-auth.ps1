# Test script to verify login flow
$signupBody = @{
    email = "testuser@example.com"
    password = "password123"
    name = "Test User"
    role = "student"
} | ConvertTo-Json

Write-Host "📝 Testing Signup endpoint..."
$signupResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/signup" `
    -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $signupBody `
    -SkipHttpErrorCheck

if ($signupResponse.StatusCode -eq 201) {
    Write-Host "✅ Signup successful!"
    $signupData = $signupResponse.Content | ConvertFrom-Json
    Write-Host "Token: $($signupData.token.Substring(0, 20))..."
    Write-Host "User: $($signupData.user.email)"
    $token = $signupData.token
} else {
    Write-Host "❌ Signup failed: $($signupResponse.StatusCode)"
    Write-Host "Response: $($signupResponse.Content)"
    exit 1
}

# Test signin
Write-Host "`n🔑 Testing Signin endpoint..."
$signinBody = @{
    email = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

$signinResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/signin" `
    -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $signinBody `
    -SkipHttpErrorCheck

if ($signinResponse.StatusCode -eq 200) {
    Write-Host "✅ Signin successful!"
    $signinData = $signinResponse.Content | ConvertFrom-Json
    Write-Host "Token: $($signinData.token.Substring(0, 20))..."
    $token = $signinData.token
} else {
    Write-Host "❌ Signin failed: $($signinResponse.StatusCode)"
    Write-Host "Response: $($signinResponse.Content)"
    exit 1
}

# Test /me endpoint
Write-Host "`n👤 Testing /me endpoint..."
$meResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" `
    -Method Get `
    -Headers @{ 
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } `
    -SkipHttpErrorCheck

if ($meResponse.StatusCode -eq 200) {
    Write-Host "✅ /me endpoint successful!"
    $meData = $meResponse.Content | ConvertFrom-Json
    Write-Host "User ID: $($meData.user.id)"
    Write-Host "User Email: $($meData.user.email)"
    Write-Host "User Name: $($meData.user.name)"
    Write-Host "User Role: $($meData.user.role)"
} else {
    Write-Host "❌ /me endpoint failed: $($meResponse.StatusCode)"
    Write-Host "Response: $($meResponse.Content)"
    exit 1
}

Write-Host "`n✅ All auth tests passed!"
