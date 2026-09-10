$ErrorActionPreference = 'Stop'

$flutter = 'D:\flutter\bin\flutter.bat'

if (-not (Test-Path -LiteralPath $flutter)) {
  throw "Flutter was not found at $flutter"
}

Write-Host 'Starting SoundClone Web at http://localhost:59060'
Write-Host 'Open that address in your normal Chrome/Edge profile.'
Write-Host 'Keep the same hostname, port, and browser profile to retain downloads.'

& $flutter run `
  -d web-server `
  --web-hostname localhost `
  --web-port 59060
