$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $root "data"
$indexPath = Join-Path $dataDir "index.json"
$bundlePath = Join-Path $dataDir "generated-bundle.js"

$catalog = Get-Content -Raw -Encoding UTF8 $indexPath | ConvertFrom-Json
$library = [ordered]@{}

foreach ($item in $catalog.surahs) {
    $filePath = Join-Path $dataDir $item.file
    if (Test-Path $filePath) {
        $payload = Get-Content -Raw -Encoding UTF8 $filePath | ConvertFrom-Json
    } else {
        $payload = [pscustomobject]@{
            id=$item.id; ayat=@(); understand=@(); matching=@(); practice=@(); quiz=@()
        }
    }

    $merged = [ordered]@{}
    foreach($p in $item.PSObject.Properties){ $merged[$p.Name] = $p.Value }
    foreach($p in $payload.PSObject.Properties){ $merged[$p.Name] = $p.Value }
    $library[$item.id] = $merged
}

$catalogJson = $catalog | ConvertTo-Json -Depth 100 -Compress
$libraryJson = $library | ConvertTo-Json -Depth 100 -Compress

$content = @"
// ملف مولّد تلقائيًا من ملفات JSON للتشغيل المحلي بدون خادم.
// لا تعدّل هذا الملف يدويًا.
window.SURAH_CATALOG = $catalogJson;
window.SURAH_LIBRARY = $libraryJson;
"@

[System.IO.File]::WriteAllText($bundlePath, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host ""
Write-Host "تم تحديث generated-bundle.js بنجاح." -ForegroundColor Green
Write-Host "يمكنك الآن فتح index.html مباشرة." -ForegroundColor Cyan
