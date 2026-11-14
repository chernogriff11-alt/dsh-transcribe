# Синтезирует фразу голосом Windows (SAPI), отправляет PCM16LE mono 16 кГц
# на маршрут плагина и печатает ответ + тайминги.
#
#   .\wake-probe.ps1 -Text "окей дипсик" -Route wake -Phrase "окей дипсик"
#   .\wake-probe.ps1 -Text "open settings" -Voice "Microsoft Zira Desktop"
#   .\wake-probe.ps1 -Text "открой настройки" -Route partial -Lang en
#
# Без -Lang подсказка языка не отправляется — так проверяется автоопределение
# (именно это обещает README).
#
# Нужен живой DSH: маршруты /dsh-transcribe/* на порту -Port (по умолчанию 2589).

param(
  [Parameter(Mandatory = $true)][string]$Text,
  [string]$Route = 'wake',
  [string]$Phrase = 'окей дипсик',
  [int]$Port = 2589,
  [string]$Voice = 'Microsoft Irina Desktop',
  [string]$Lang = '',
  [int]$Rate = 0,
  [switch]$KeepWav
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$wav = Join-Path $env:TEMP ('dstr-probe-' + [guid]::NewGuid().ToString('N') + '.wav')
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $synth.SelectVoice($Voice)
  $synth.Rate = $Rate
  $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
    16000,
    [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
    [System.Speech.AudioFormat.AudioChannel]::Mono)
  $synth.SetOutputToWaveFile($wav, $fmt)
  $synth.Speak($Text)
} finally {
  $synth.Dispose()
}

$bytes = [System.IO.File]::ReadAllBytes($wav)

# RIFF разбираем по чанкам: у SAPI заголовок может быть не ровно 44 байта
# (перед data бывает LIST/fact), поэтому «всё после 44» — неверно.
function Get-PcmFromWav([byte[]]$data) {
  if ($data.Length -lt 12) { throw 'WAV too short' }
  $riff = [Text.Encoding]::ASCII.GetString($data, 0, 4)
  $wave = [Text.Encoding]::ASCII.GetString($data, 8, 4)
  if ($riff -ne 'RIFF' -or $wave -ne 'WAVE') { throw "not a RIFF/WAVE file: $riff/$wave" }
  $pos = 12
  while ($pos + 8 -le $data.Length) {
    $id = [Text.Encoding]::ASCII.GetString($data, $pos, 4)
    $size = [BitConverter]::ToUInt32($data, $pos + 4)
    $body = $pos + 8
    if ($id -eq 'data') {
      $length = [Math]::Min([int]$size, $data.Length - $body)
      $pcm = New-Object byte[] $length
      [Array]::Copy($data, $body, $pcm, 0, $length)
      # Запятая обязательна: без неё PowerShell разворачивает массив в
      # Object[] поэлементно, и тело запроса уходит мусором.
      return ,$pcm
    }
    $pos = $body + [int]$size + ([int]$size % 2)
  }
  throw 'no data chunk in WAV'
}

$pcm = Get-PcmFromWav $bytes

$url = "http://127.0.0.1:$Port/dsh-transcribe/$Route" + '?sr=16000'
if ($Lang) { $url += '&lang=' + [uri]::EscapeDataString($Lang) }
if ($Route -eq 'wake') { $url += '&phrase=' + [uri]::EscapeDataString($Phrase) }

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$resp = Invoke-WebRequest -Uri $url -Method Post -Body $pcm `
  -ContentType 'application/octet-stream' -UseBasicParsing -TimeoutSec 120
$sw.Stop()

$json = $resp.Content | ConvertFrom-Json
[pscustomobject]@{
  text      = $json.text
  hit       = $json.hit
  language  = $json.language
  seconds   = $json.seconds
  server_ms = $json.ms
  wall_ms   = $sw.ElapsedMilliseconds
  pcm_bytes = $pcm.Length
  url       = $url
} | Format-List

if ($KeepWav) { "wav: $wav" } else { Remove-Item $wav -Force -ErrorAction SilentlyContinue }
