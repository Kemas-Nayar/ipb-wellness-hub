$files = Get-ChildItem -Path "src/styles" -Filter "*.css" -Recurse

foreach ($f in $files) {
    $lines = Get-Content $f.FullName
    $result = @()
    $i = 0
    
    while ($i -lt $lines.Count) {
        $line = $lines[$i]
        
        # Pattern 1: 3-line block /* ====...= \n   TITLE \n ====...= */
        if ($line -match '^\s*/\*\s*[=]{5,}' -and ($i + 2) -lt $lines.Count -and $lines[$i + 2] -match '[=]{5,}\s*\*/') {
            $titleLine = $lines[$i + 1].Trim()
            $result += "/* $titleLine */"
            $i += 3
            continue
        }
        
        # Pattern 2: single-line /* ===== SECTION ===== */
        if ($line -match '^\s*/\*\s*={3,}\s+(.+?)\s+={3,}\s*\*/' ) {
            $section = $Matches[1]
            $leading = $line -replace '/\*.*', ''
            $result += "${leading}/* $section */"
            $i++
            continue
        }
        
        $result += $line
        $i++
    }
    
    $result | Set-Content $f.FullName
}

Write-Host "CSS equals cleanup done"
