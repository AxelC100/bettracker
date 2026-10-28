$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
$taskAsTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Wait-Task($Operation, $ResultType) {
 $taskConverted = $taskAsTask.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
 try { $taskConverted.Wait() } catch { throw $taskConverted.Exception.GetBaseException().Message }
 return $taskConverted.Result
}
$taskFile = Wait-Task ([Windows.Storage.StorageFile]::GetFileFromPathAsync($args[0])) ([Windows.Storage.StorageFile])
$taskStream = Wait-Task ($taskFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
try {
 $taskDecoder = Wait-Task ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($taskStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
 if ($taskDecoder.PixelWidth -gt 4096 -or $taskDecoder.PixelHeight -gt 4096) { throw 'Image dimensions too large for local OCR' }
 $taskBitmap = Wait-Task ($taskDecoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
 try {
  $taskEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  if (!$taskEngine) { throw 'OCR language unavailable' }
  $taskResult = Wait-Task ($taskEngine.RecognizeAsync($taskBitmap)) ([Windows.Media.Ocr.OcrResult])
  $taskLines = @($taskResult.Lines | ForEach-Object { $_.Text })
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
  Write-Output (ConvertTo-Json -InputObject $taskLines -Compress)
 } finally { $taskBitmap.Dispose() }
} finally { $taskStream.Dispose() }
