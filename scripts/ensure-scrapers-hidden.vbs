Option Explicit
Dim taskShell, taskFS, taskScriptDir, taskScript, taskCommand, taskExit
Set taskShell = CreateObject("WScript.Shell")
Set taskFS = CreateObject("Scripting.FileSystemObject")
taskScriptDir = taskFS.GetParentFolderName(WScript.ScriptFullName)
taskScript = taskFS.BuildPath(taskScriptDir, "ensure-scrapers.ps1")
taskCommand = Chr(34) & taskShell.ExpandEnvironmentStrings("%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe") & Chr(34) & " -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File " & Chr(34) & taskScript & Chr(34)
taskExit = taskShell.Run(taskCommand, 0, True)
WScript.Quit taskExit
