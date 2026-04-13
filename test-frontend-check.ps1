$response = Invoke-WebRequest -Uri 'http://localhost:5174' -UseBasicParsing
Write-Host "Frontend status: $($response.StatusCode)"