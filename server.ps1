# PowerShell Static Web Server for OmniFormat AI
param([int]$Port = 5500)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "OmniFormat AI server running at $prefix" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

    $basePath = $PSScriptRoot

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq '/' -or $rawUrl -eq '') {
            $rawUrl = '/index.html'
        }

        $localPath = [System.IO.Path]::Combine($basePath, $rawUrl.TrimStart('/'))
        $localPath = [System.IO.Path]::GetFullPath($localPath)

        if ($localPath.StartsWith($basePath) -and [System.IO.File]::Exists($localPath)) {
            $extension = [System.IO.Path]::GetExtension($localPath).ToLower()
            $mime = switch ($extension) {
                '.html' { 'text/html; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                '.js'   { 'text/javascript; charset=utf-8' }
                '.json' { 'application/json' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.svg'  { 'image/svg+xml' }
                '.wav'  { 'audio/wav' }
                '.mp3'  { 'audio/mpeg' }
                '.mp4'  { 'video/mp4' }
                default { 'application/octet-stream' }
            }

            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentType = "text/plain"
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}
