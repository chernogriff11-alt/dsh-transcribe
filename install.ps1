# dsh-transcribe installer: downloads the engine and the model into the
# locations the plugin searches by default.
#
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
#
# Optional: -Model Q4_K_M (smaller, faster) or -Model F16 (largest),
#           -SkipChecksum (do not verify the engine against SHA256SUMS.txt).

param(
  [string]$Repo = "chernogriff11-alt/dsh-transcribe",
  [string]$Model = "Q8_0",
  [switch]$SkipChecksum
)

$ErrorActionPreference = "Stop"

$binDir = Join-Path $env:USERPROFILE ".dsh\bin"
$modelDir = Join-Path $env:USERPROFILE ".dsh\models\parakeet-ultra"
New-Item -ItemType Directory -Force -Path $binDir, $modelDir | Out-Null

# Контрольные суммы релиза: сверяем движок, иначе установщик тянет любой exe,
# который окажется по ссылке.
function Get-ReleaseSums([string]$repo) {
  $url = "https://github.com/$repo/releases/latest/download/SHA256SUMS.txt"
  try {
    return (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30).Content
  } catch {
    return $null
  }
}

function Test-ReleaseHash([string]$path, [string]$name, [string]$sums) {
  if (-not $sums) { return $null }
  $lines = ($sums -split "\r?\n") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  $line = ($lines | Where-Object { $_ -match ([regex]::Escape($name) + '$') } | Select-Object -First 1)
  if (-not $line) { return $null }
  $expected = (($line -split '\s+') | Where-Object { $_ } | Select-Object -First 1).Trim().ToLower()
  if (-not $expected) { return $null }
  $actual = (Get-FileHash -Algorithm SHA256 -Path $path).Hash.ToLower()
  return ($expected -eq $actual)
}

$exe = Join-Path $binDir "transcribe-cli.exe"
if (-not (Test-Path $exe)) {
  $url = "https://github.com/$Repo/releases/latest/download/transcribe-cli.exe"
  Write-Host "Downloading transcribe-cli.exe ..."
  & curl.exe -L --fail --output $exe $url
  if ($LASTEXITCODE -ne 0) { throw "Failed to download $url" }
  if (-not $SkipChecksum) {
    $sums = Get-ReleaseSums $Repo
    if (-not $sums) {
      Write-Warning "SHA256SUMS.txt not found in the release: transcribe-cli.exe was not verified."
    } else {
      $verified = Test-ReleaseHash $exe "transcribe-cli.exe" $sums
      if ($verified -eq $false) {
        Remove-Item $exe -Force -ErrorAction SilentlyContinue
        throw "SHA256 mismatch for transcribe-cli.exe - the download was removed."
      }
      if ($verified -eq $true) { Write-Host "SHA256 verified: transcribe-cli.exe" }
      if ($null -eq $verified) { Write-Warning "transcribe-cli.exe is not listed in SHA256SUMS.txt." }
    }
  }
} else {
  Write-Host "transcribe-cli.exe already present."
}

$modelFile = "parakeet-ultra-$Model.gguf"
$modelPath = Join-Path $modelDir $modelFile
if (-not (Test-Path $modelPath)) {
  $url = "https://huggingface.co/handy-computer/parakeet-ultra-gguf/resolve/main/$modelFile"
  Write-Host "Downloading $modelFile (this can take a few minutes) ..."
  & curl.exe -L --fail --output $modelPath $url
  if ($LASTEXITCODE -ne 0) { throw "Failed to download $url" }
} else {
  Write-Host "$modelFile already present."
}

Write-Host ""
Write-Host "Engine: $exe"
Write-Host "Model:  $modelPath"
Write-Host ""
Write-Host "Next: install the plugin, fully quit DeepSeek Harness (tray too), reopen it, refresh the page."
