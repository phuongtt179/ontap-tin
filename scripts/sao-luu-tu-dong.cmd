@echo off
rem Chạy bởi Task Scheduler "SaoLuuNeon" (thứ Năm 21:00 hằng tuần). Ghi kết quả vào SaoLuu\nhat-ky-sao-luu.txt
cd /d "%~dp0.."
echo ===== %date% %time% ===== >> "SaoLuu\nhat-ky-sao-luu.txt"
"C:\Program Files\nodejs\node.exe" scripts\sao-luu-neon.mjs >> "SaoLuu\nhat-ky-sao-luu.txt" 2>&1
echo ket thuc, ma loi %errorlevel% >> "SaoLuu\nhat-ky-sao-luu.txt"
