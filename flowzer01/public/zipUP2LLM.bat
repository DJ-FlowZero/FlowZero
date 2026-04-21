@echo off

del currentpuck.txt 2>nul

echo === FILES SEEN ===
for %%f in (fz*.* FZ*.*) do (
  echo %%f
)

echo. > currentpuck.txt
for %%f in (fz*.* FZ*.*) do (
  echo ===== %%f ===== >> currentpuck.txt
  type "%%f" >> currentpuck.txt
  echo. >> currentpuck.txt
)

echo PUCK flattened to currentpuck.txt
pause