# Start VWYD dev servers
$py = "C:\Users\Tomi\AppData\Local\Programs\Python\Python312\python.exe"
$root = "C:\Users\Tomi\.openclaw\workspace\vote-with-your-dollar"

# Start backend
$backend = Start-Process -FilePath $py -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","3001" -WorkingDirectory "$root\backend_v2" -PassThru -WindowStyle Hidden
Write-Host "Backend PID: $($backend.Id)"

Start-Sleep 2

# Start frontend  
$frontend = Start-Process -FilePath "cmd" -ArgumentList "/c","cd /d `"$root\frontend`" && npx vite --host 127.0.0.1" -PassThru -WindowStyle Hidden
Write-Host "Frontend PID: $($frontend.Id)"

Start-Sleep 3

# Verify
$b = netstat -ano | Select-String "3001.*LISTENING"
$f = netstat -ano | Select-String "5173.*LISTENING"
if ($b) { Write-Host "Backend: OK (port 3001)" } else { Write-Host "Backend: FAILED" }
if ($f) { Write-Host "Frontend: OK (port 5173)" } else { Write-Host "Frontend: FAILED" }
