Write-Host "1. Testing POST /api/auth/signup ..."
$signupBody = @{
    name = "Satya Farm Owner"
    phone = "+91 99999 88888"
    email = "satya@dairyfarm.com"
    password = "password123"
    farmName = "Satya Dairy Farm"
    role = "OWNER"
} | ConvertTo-Json

try {
    $auth = Invoke-RestMethod -Uri "http://localhost:8085/api/auth/signup" -Method Post -ContentType "application/json" -Body $signupBody
} catch {
    Write-Host "   (Already registered, logging in...)"
    $loginBody = @{
        phoneOrEmail = "+91 99999 88888"
        password = "password123"
    } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "http://localhost:8085/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
}

Write-Host "   -> User: $($auth.user.name)"
Write-Host "   -> Farm: $($auth.user.farmName)"
Write-Host "   -> Role: $($auth.user.role)"
Write-Host "   -> Token length: $($auth.token.Length)"

$randomTag = "COW-" + (Get-Random -Minimum 1000 -Maximum 9999)

Write-Host "`n2. Testing POST /api/animals (Creating new Animal $randomTag with History) ..."
$headers = @{
    Authorization = "Bearer $($auth.token)"
}

$newAnimalBody = @{
    name = "Lakshmi"
    tag = $randomTag
    breed = "Sahiwal"
    birthDate = "2023-08-15"
    birthStatus = "Normal Calving"
    fatherTag = "SIRE-ALPHA"
    fatherName = "Alpha Bull"
    motherTag = "DAM-SHYAMA"
    motherName = "Shyama Cow"
    aiDate = "2024-03-10"
    lastVaccinationDate = "2024-07-01"
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "http://localhost:8085/api/animals" -Method Post -ContentType "application/json" -Headers $headers -Body $newAnimalBody
Write-Host "   -> Created Animal: $($created.data.name) [$($created.data.tag)] (ID: $($created.data.id))"
Write-Host "   -> Father Tag: $($created.data.fatherTag)"
Write-Host "   -> Mother Tag: $($created.data.motherTag)"

Write-Host "`n3. Testing GET /api/animals from PostgreSQL ..."
$animals = Invoke-RestMethod -Uri "http://localhost:8085/api/animals" -Method Get -Headers $headers
Write-Host "   -> Total Animals in PostgreSQL: $($animals.data.totalElements)"
foreach ($a in $animals.data.content) {
    Write-Host "   * Animal: $($a.name) [$($a.tag)] - $($a.breed) (Status: $($a.status))"
}

$targetId = $created.data.id
if (-not $targetId) {
    $targetId = $animals.data.content[0].id
}

Write-Host "`n4. Testing GET /api/animals/$targetId/history ..."
$history = Invoke-RestMethod -Uri "http://localhost:8085/api/animals/$targetId/history" -Method Get -Headers $headers
Write-Host "   -> History Events count: $($history.data.Count)"
foreach ($h in $history.data) {
    Write-Host "   * Event: [$($h.eventType)] $($h.eventDate) - $($h.title): $($h.detail)"
}

