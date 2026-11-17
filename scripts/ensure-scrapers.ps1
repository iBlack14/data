$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$taskShell = (Get-Command powershell.exe).Source
$taskDefinitions = @(
    @{ Watch = 'watch-turismo-peru.ps1'; Worker = 'prospect-turismo-peru.mjs'; Extra = $false; Directory = 'outputs/brightdata/turismo_peru' },
    @{ Watch = 'watch-ferreterias-peru.ps1'; Worker = 'prospect-turismo-peru.mjs'; Extra = $true; Directory = 'outputs/brightdata/ferreterias_peru' },
    @{ Watch = 'watch-ingenieria-peru.ps1'; Worker = 'prospect-ingenieria-directo.mjs'; Extra = $false; Directory = 'outputs/directo/empresas_de_ingenier_a' }
)
foreach ($taskDefinition in $taskDefinitions) {
    $taskProcesses = @(Get-CimInstance Win32_Process)
    $taskRunningWatch = $taskProcesses | Where-Object { $_.Name -match '^powershell.exe$' -and $_.CommandLine -like "*$($taskDefinition.Watch)*" }
    if ($taskRunningWatch) { continue }
    $taskRunningWorker = $taskProcesses | Where-Object {
        $_.Name -eq 'node.exe' -and $_.CommandLine -like "*$($taskDefinition.Worker)*" -and
        ($_.CommandLine.Contains('--ferreterias') -eq $taskDefinition.Extra)
    }
    if ($taskRunningWorker) { continue }
    $taskDir = Join-Path $taskRoot $taskDefinition.Directory
    $taskWatchPath = Join-Path $PSScriptRoot $taskDefinition.Watch
    $taskNewWatch = Start-Process -FilePath $taskShell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $taskWatchPath + '"') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskDir 'supervisor.stdout.log') -RedirectStandardError (Join-Path $taskDir 'supervisor.stderr.log') -PassThru
    $taskNewWatch.Id | Set-Content (Join-Path $taskDir 'supervisor.pid')
}
