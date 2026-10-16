# Test helper: optionally clicks inside the TokensTab window (coordinates in CSS px of the 420x800 UI), then saves a screenshot.
# Usage: powershell -File tools/win-shot.ps1 -Out shot.png [-X 330 -Y 75]
param([string]$Out, [int]$X = -1, [int]$Y = -1, [int]$Wait = 900, [int]$Wheel = 0)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Runtime.InteropServices;
public class TT { [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, Ri, B; }
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e); }
'@
[TT]::SetProcessDPIAware() | Out-Null
$p = Get-Process tokenstab | Select-Object -First 1
$h = $p.MainWindowHandle; [TT]::SetForegroundWindow($h) | Out-Null; Start-Sleep -Milliseconds 400
$r = New-Object TT+R; [TT]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.Ri - $r.L; $hh = $r.B - $r.T; $scale = $hh / 800.0
if ($Wheel -ne 0) {
  [TT]::SetCursorPos([int]($r.L + 210 * $scale), [int]($r.T + 400 * $scale)) | Out-Null; Start-Sleep -Milliseconds 100
  for ($i = 0; $i -lt [math]::Abs($Wheel); $i++) { [TT]::mouse_event(0x0800, 0, 0, [math]::Sign($Wheel) * 120, 0); Start-Sleep -Milliseconds 40 }
  Start-Sleep -Milliseconds 500
}
if ($X -ge 0) {
  [TT]::SetCursorPos([int]($r.L + $X * $scale), [int]($r.T + $Y * $scale)) | Out-Null; Start-Sleep -Milliseconds 120
  [TT]::mouse_event(2, 0, 0, 0, 0); Start-Sleep -Milliseconds 60; [TT]::mouse_event(4, 0, 0, 0, 0)
  Start-Sleep -Milliseconds $Wait
}
$bmp = New-Object System.Drawing.Bitmap $w, $hh
$g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($r.L, $r.T, 0, 0, $bmp.Size)
$bmp.Save($Out); $g.Dispose(); $bmp.Dispose()
"saved $Out ($w x $hh, scale $scale)"
