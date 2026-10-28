$ErrorActionPreference = 'Stop'
$taskData = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.postgres.local/data'))
if (!(Test-Path -LiteralPath (Join-Path $taskData 'PG_VERSION'))) { throw 'No se encuentra la instancia local de desarrollo.' }
$taskVersion = (Get-Content -LiteralPath (Join-Path $taskData 'PG_VERSION')).Trim()
$taskExecutable = Join-Path $env:ProgramFiles "PostgreSQL/$taskVersion/bin/postgres.exe"
if (!(Test-Path -LiteralPath $taskExecutable)) { throw 'No se encuentra postgres.exe para esta version.' }
$taskSocket = [Net.Sockets.TcpClient]::new()
try { $taskSocket.Connect('127.0.0.1',5433); Write-Host 'El puerto local 5433 ya esta activo.'; exit 0 } catch {} finally { $taskSocket.Dispose() }
$taskProcess = Start-Process -FilePath $taskExecutable -ArgumentList @('-D', ('"' + $taskData + '"'), '-p', '5433', '-h', '127.0.0.1') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot '../.postgres.local/stdout.log') -RedirectStandardError (Join-Path $PSScriptRoot '../.postgres.local/stderr.log')
for ($taskAttempt=0; $taskAttempt -lt 30; $taskAttempt++) {
  if ($taskProcess.HasExited) { throw 'PostgreSQL no pudo arrancar. Revisa server/.postgres.local/stderr.log.' }
  $taskProbe = [Net.Sockets.TcpClient]::new()
  try { $taskProbe.Connect('127.0.0.1',5433); Write-Host 'PostgreSQL de BetTracker disponible en 127.0.0.1:5433'; exit 0 } catch {} finally { $taskProbe.Dispose() }
  Start-Sleep -Milliseconds 200
}
throw 'PostgreSQL tardo demasiado en arrancar.'
