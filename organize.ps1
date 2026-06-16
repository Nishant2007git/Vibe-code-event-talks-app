# PowerShell script to organize files in this directory
# Usage: .\organize.ps1

$currentDir = Get-Location
Write-Host "Organizing files in: $currentDir"

$imagesDir = Join-Path $currentDir "Images"
$docsDir = Join-Path $currentDir "Documents"
$videosDir = Join-Path $currentDir "Videos"

# Ensure directories exist
if (!(Test-Path $imagesDir)) { New-Item -ItemType Directory -Path $imagesDir | Out-Null }
if (!(Test-Path $docsDir)) { New-Item -ItemType Directory -Path $docsDir | Out-Null }
if (!(Test-Path $videosDir)) { New-Item -ItemType Directory -Path $videosDir | Out-Null }

$movedImages = 0
$movedDocs = 0
$movedVideos = 0

# Scan and move files
Get-ChildItem -Path $currentDir -File | ForEach-Object {
    $ext = $_.Extension.ToLower()
    
    if ($ext -in '.jpg', '.jpeg', '.gif') {
        Move-Item $_.FullName -Destination $imagesDir -Force
        Write-Host " [Images] Moved: $_.Name"
        $movedImages++
    }
    elseif ($ext -eq '.txt') {
        Move-Item $_.FullName -Destination $docsDir -Force
        Write-Host " [Documents] Moved: $_.Name"
        $movedDocs++
    }
    elseif ($ext -eq '.mp4') {
        Move-Item $_.FullName -Destination $videosDir -Force
        Write-Host " [Videos] Moved: $_.Name"
        $movedVideos++
    }
}

Write-Host "`nSummary:"
Write-Host "--------------------"
Write-Host "Images moved: $movedImages"
Write-Host "Documents moved: $movedDocs"
Write-Host "Videos moved: $movedVideos"
