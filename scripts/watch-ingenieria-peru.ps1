$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$taskDir = Join-Path (Get-Location) 'outputs/directo/empresas_de_ingenier_a'
$taskNode = (Get-Command node).Source
while ($true) {
    try {
        $taskStateFile = Join-Path $taskDir '_progreso.json'
        if (Test-Path -LiteralPath $taskStateFile) {
            $taskState = Get-Content $taskStateFile -Raw | ConvertFrom-Json
            if (@($taskState.completed.psobject.Properties).Count -ge 1892) { break }
        }
        $taskChild = Start-Process -FilePath $taskNode -ArgumentList 'scripts/prospect-ingenieria-directo.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskDir 'barrido.stdout.log') -RedirectStandardError (Join-Path $taskDir 'barrido.stderr.log') -PassThru
        $taskChild.Id | Set-Content (Join-Path $taskDir 'process.pid')
        $taskChild.WaitForExit()
        Add-Content (Join-Path $taskDir 'supervisor.log') "$(Get-Date -Format o) Proceso finalizado, código $($taskChild.ExitCode)"
    } catch {
        Add-Content (Join-Path $taskDir 'supervisor.log') "$(Get-Date -Format o) $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 60
}
