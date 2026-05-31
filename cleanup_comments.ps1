$files = Get-ChildItem -Path "src/components" -Filter "*.jsx" -Recurse

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    
    # Remove // ─── SECTION ─── style comments
    $content = $content -replace '// [─═]+ [^\r\n]+ [─═]+\r?\n', ''
    
    # Remove /* ─── SECTION ─── */ style comments
    $content = $content -replace '/\* [─═]+ [^\r\n]+ [─═]+ \*/\r?\n', ''
    
    # Remove {/* ── SECTION ── */} style JSX comments
    $content = $content -replace '\s*\{/\* ── [^\r\n]+ ── \*/\}\r?\n', "`n"
    
    # Remove standalone // ─────── lines
    $content = $content -replace '// [─═]{10,}\r?\n', ''
    
    # Remove // ── Section ── style comments
    $content = $content -replace '  // ── [^\r\n]+ ──\r?\n', ''
    
    Set-Content $f.FullName $content -NoNewline
}

Write-Host "Done cleaning comments"
