$signupBody = @{
    email = 'test4@example.com'
    password = 'pass123'
    name = 'Test'
    role = 'student'
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $signupBody `
    -UseBasicParsing

Write-Host "Status: $($res.StatusCode)"
Write-Host "Content:"
Write-Host $res.Content
$data = $res.Content | ConvertFrom-Json
Write-Host "`nParsed JSON:"
Write-Host "  token: $(if ($data.token) { $data.token.Substring(0,30) + '...' } else { 'NOT FOUND' })"
Write-Host "  user.email: $($data.user.email)"
Write-Host "  user.id: $($data.user.id)"
