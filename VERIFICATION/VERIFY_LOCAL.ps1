# Run from any directory with the API already running on port 4317.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $PSScriptRoot 'LOCAL_COMMAND_RESULTS.txt'
$matrixPath = Join-Path $PSScriptRoot 'ACCEPTANCE_TEST_MATRIX.csv'
"Local command verification: $(Get-Date -Format o)" | Set-Content $log
function Invoke-Logged([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments 2>&1 | Tee-Object -FilePath $log -Append | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "$Command $Arguments failed (exit $LASTEXITCODE)" }
}
function Set-BuildResult([string]$Status, [string]$Actual) {
    $matrix = Import-Csv $matrixPath
    $row = $matrix | Where-Object Case_ID -eq 'T-27'
    $row.Status = $Status; $row.Actual_Result = $Actual
    $row.Environment = "Windows; Node $(& node --version); npm $(& npm.cmd --version)"
    $row.Evidence = 'LOCAL_COMMAND_RESULTS.txt'
    $matrix | Export-Csv -Path $matrixPath -NoTypeInformation -Encoding UTF8
}
Push-Location (Join-Path $root 'INPUT_FILES\STARTER')
try {
    Invoke-Logged 'node' @('--version')
    Invoke-Logged 'npm.cmd' @('--version')
    Invoke-Logged 'node' @('../TESTS/api_smoke_test.cjs')
    Invoke-Logged 'node' @('../TESTS/api_reconciliation.cjs')
    Invoke-Logged 'npm.cmd' @('test')
    try { Invoke-Logged 'npm.cmd' @('run','build'); Set-BuildResult 'PASS' 'Production build exited successfully' }
    catch { Set-BuildResult 'FAIL' 'Production build failed; see local command log'; throw }
    'API, logic and build verified. Start npm run preview and execute browser_qa.py next.' | Tee-Object -FilePath $log -Append
} catch { "FAILED: $_" | Tee-Object -FilePath $log -Append; throw }
finally { Pop-Location }
