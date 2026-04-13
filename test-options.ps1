$headers = @{
    'Access-Control-Request-Method' = 'POST'
    'Access-Control-Request-Headers' = 'content-type'
    'Origin' = 'http://localhost:5174'
}

$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signin' -Method Options -Headers $headers -UseBasicParsing
Write-Host "OPTIONS request status: $($response.StatusCode)"