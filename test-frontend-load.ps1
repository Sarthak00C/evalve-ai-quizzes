$response = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing
Write-Host 'Frontend loaded successfully!'
Write-Host "Status: $($response.StatusCode)"
Write-Host "Content length: $($response.Content.Length)"
if ($response.Content -match 'React' -or $response.Content -match 'root') {
    Write-Host '✅ React app detected in HTML'
} else {
    Write-Host '⚠️  Could not verify React app'
}
