$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$taskDir = Join-Path (Get-Location) 'outputs/brightdata/ferreterias_peru'
New-Item -ItemType Directory -Path $taskDir -Force | Out-Null
$taskNode = (Get-Command node).Source
while ($true) {
    $taskStateFile = Join-Path $taskDir '_progreso.json'
    if (Test-Path -LiteralPath $taskStateFile) {
        $taskState = Get-Content $taskStateFile -Raw | ConvertFrom-Json
        if ($taskState.status -eq 'complete') { break }
    }
    try {
        $taskChild = Start-Process -FilePath $taskNode -ArgumentList 'scripts/prospect-turismo-peru.mjs','--ferreterias' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskDir 'continuo.stdout.log') -RedirectStandardError (Join-Path $taskDir 'continuo.stderr.log') -PassThru
        $taskChild.Id | Set-Content (Join-Path $taskDir 'process.pid')
        $taskChild.WaitForExit()
        Add-Content (Join-Path $taskDir 'supervisor.log') "$(Get-Date -Format o) Proceso finalizado, código $($taskChild.ExitCode)"
    } catch {
        Add-Content (Join-Path $taskDir 'supervisor.log') "$(Get-Date -Format o) $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 60
}
