$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$taskDir = Join-Path (Get-Location) 'outputs/brightdata/turismo_peru'
$taskNode = (Get-Command node).Source
while ($true) {
    $taskState = Get-Content (Join-Path $taskDir '_progreso.json') -Raw | ConvertFrom-Json
    if ($taskState.status -eq 'complete') { break }
    try {
        $taskChild = Start-Process -FilePath $taskNode -ArgumentList 'scripts/prospect-turismo-peru.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskDir 'continuo.stdout.log') -RedirectStandardError (Join-Path $taskDir 'continuo.stderr.log') -PassThru
        $taskChild.Id | Set-Content (Join-Path $taskDir 'process.pid')
        $taskChild.WaitForExit()
        Add-Content (Join-Path $taskDir 'supervisor.log') "$(Get-Date -Format o) Proceso finalizado, código $($taskChild.ExitCode)"
    } catch {
        Add-Content (Join-Path $taskDir 'supervisor.log') "$(Get-Date -Format o) $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 60
}
