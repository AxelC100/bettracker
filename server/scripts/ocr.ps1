$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapTransform, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
$taskAsTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Wait-Task($Operation, $ResultType) {
 $taskConverted = $taskAsTask.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
 try { $taskConverted.Wait() } catch { throw $taskConverted.Exception.GetBaseException().Message }
 return $taskConverted.Result
}
$taskInputPath = $args[0]
if ($args.Count -gt 2 -and @('invert','auto') -contains $args[2]) {
 Add-Type -AssemblyName System.Drawing
 $taskOriginal = [System.Drawing.Image]::FromFile($taskInputPath)
 try {
  if ($taskOriginal.Width -gt 4096 -or $taskOriginal.Height -gt 4096) { throw 'Image dimensions too large for local OCR' }
  $taskDark = $args[2] -eq 'invert'
  if ($args[2] -eq 'auto') {
   $taskLight = 0
   for ($taskY=0; $taskY -lt 12; $taskY++) {
    for ($taskX=0; $taskX -lt 12; $taskX++) {
     $taskPixel = ([System.Drawing.Bitmap]$taskOriginal).GetPixel([Math]::Min($taskOriginal.Width-1,[int](($taskX+0.5)*$taskOriginal.Width/12)),[Math]::Min($taskOriginal.Height-1,[int](($taskY+0.5)*$taskOriginal.Height/12)))
     $taskLight += 0.2126*$taskPixel.R+0.7152*$taskPixel.G+0.0722*$taskPixel.B
    }
   }
   $taskDark = ($taskLight / 144) -lt 128
  }
  if ($taskDark) {
  $taskProcessed = New-Object System.Drawing.Bitmap($taskOriginal.Width, $taskOriginal.Height)
  try {
   $taskGraphics = [System.Drawing.Graphics]::FromImage($taskProcessed)
   $taskAttributes = New-Object System.Drawing.Imaging.ImageAttributes
   try {
    $taskMatrix = New-Object System.Drawing.Imaging.ColorMatrix
    $taskMatrix.Matrix00 = -1; $taskMatrix.Matrix11 = -1; $taskMatrix.Matrix22 = -1
    $taskMatrix.Matrix40 = 1; $taskMatrix.Matrix41 = 1; $taskMatrix.Matrix42 = 1
    $taskAttributes.SetColorMatrix($taskMatrix)
    $taskGraphics.DrawImage($taskOriginal, (New-Object System.Drawing.Rectangle(0,0,$taskOriginal.Width,$taskOriginal.Height)),0,0,$taskOriginal.Width,$taskOriginal.Height,[System.Drawing.GraphicsUnit]::Pixel,$taskAttributes)
    $taskInputPath = Join-Path ([IO.Path]::GetDirectoryName($taskInputPath)) 'ocr-inverted.png'
    $taskProcessed.Save($taskInputPath,[System.Drawing.Imaging.ImageFormat]::Png)
   } finally { $taskAttributes.Dispose(); $taskGraphics.Dispose() }
  } finally { $taskProcessed.Dispose() }
  }
 } finally { $taskOriginal.Dispose() }
}
$taskFile = Wait-Task ([Windows.Storage.StorageFile]::GetFileFromPathAsync($taskInputPath)) ([Windows.Storage.StorageFile])
$taskStream = Wait-Task ($taskFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
try {
 $taskDecoder = Wait-Task ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($taskStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
 if ($taskDecoder.PixelWidth -gt 4096 -or $taskDecoder.PixelHeight -gt 4096) { throw 'Image dimensions too large for local OCR' }
 $taskMaximum = [Math]::Min(4096, [Windows.Media.Ocr.OcrEngine]::MaxImageDimension)
 $taskScale = [Math]::Min(3, [Math]::Min($taskMaximum / $taskDecoder.PixelWidth, $taskMaximum / $taskDecoder.PixelHeight))
 if ($args.Count -gt 1) { $taskScale = [Math]::Min($taskScale, [Double]$args[1]) }
 $taskTransform = New-Object Windows.Graphics.Imaging.BitmapTransform
 $taskTransform.ScaledWidth = [UInt32][Math]::Floor($taskDecoder.PixelWidth * $taskScale)
 $taskTransform.ScaledHeight = [UInt32][Math]::Floor($taskDecoder.PixelHeight * $taskScale)
 $taskTransform.InterpolationMode = [Windows.Graphics.Imaging.BitmapInterpolationMode]::Cubic
 $taskBitmap = Wait-Task ($taskDecoder.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Ignore, $taskTransform, [Windows.Graphics.Imaging.ExifOrientationMode]::RespectExifOrientation, [Windows.Graphics.Imaging.ColorManagementMode]::ColorManageToSRgb)) ([Windows.Graphics.Imaging.SoftwareBitmap])
 try {
  $taskEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  if (!$taskEngine) { throw 'OCR language unavailable' }
  $taskResult = Wait-Task ($taskEngine.RecognizeAsync($taskBitmap)) ([Windows.Media.Ocr.OcrResult])
  $taskWords = @($taskResult.Lines | ForEach-Object {
    $_.Words | ForEach-Object {
      [PSCustomObject]@{ text = $_.Text; x = $_.BoundingRect.X / $taskScale; y = $_.BoundingRect.Y / $taskScale; width = $_.BoundingRect.Width / $taskScale; height = $_.BoundingRect.Height / $taskScale }
    }
  })
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
  Write-Output (ConvertTo-Json -InputObject ([PSCustomObject]@{ words = $taskWords; width = $taskDecoder.PixelWidth; height = $taskDecoder.PixelHeight; scale = $taskScale }) -Depth 5 -Compress)
 } finally { $taskBitmap.Dispose() }
} finally { $taskStream.Dispose() }
