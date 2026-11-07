# dsh-transcribe installer: downloads the engine and the model into the
# locations the plugin searches by default.
#
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
#
# Optional: -Model Q4_K_M (smaller, faster) or -Model F16 (largest).

param(
  [string]$Repo = "chernogriff11-alt/dsh-transcribe",
  [string]$Model = "Q8_0"
)

$ErrorActionPreference = "Stop"

$binDir = Join-Path $env:USERPROFILE ".dsh\bin"
$modelDir = Join-Path $env:USERPROFILE ".dsh\models\parakeet-ultra"
New-Item -ItemType Directory -Force -Path $binDir, $modelDir | Out-Null

$exe = Join-Path $binDir "transcribe-cli.exe"
if (-not (Test-Path $exe)) {
  $url = "https://github.com/$Repo/releases/latest/download/transcribe-cli.exe"
  Write-Host "Downloading transcribe-cli.exe ..."
  & curl.exe -L --fail --output $exe $url
  if ($LASTEXITCODE -ne 0) { throw "Failed to download $url" }
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
