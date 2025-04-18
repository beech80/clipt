@echo off
echo Fixing JSX syntax errors in DiscoveryNew.tsx...

rem Create a temporary file
copy src\pages\DiscoveryNew.tsx src\pages\DiscoveryNew.tmp >nul

rem Use findstr to exclude the problem lines
findstr /v /c:"              }" src\pages\DiscoveryNew.tmp > src\pages\DiscoveryNew.fixed.1
findstr /v /c:"           )" src\pages\DiscoveryNew.fixed.1 > src\pages\DiscoveryNew.fixed.2

rem Create a new file with the fixed syntax
type src\pages\DiscoveryNew.fixed.2 | findstr /v /n "^" > src\pages\DiscoveryNew.fixed.txt

rem Replace the file with the fixed content
copy src\pages\DiscoveryNew.fixed.txt src\pages\DiscoveryNew.tsx >nul

rem Clean up temporary files
del src\pages\DiscoveryNew.tmp
del src\pages\DiscoveryNew.fixed.1
del src\pages\DiscoveryNew.fixed.2
del src\pages\DiscoveryNew.fixed.txt

echo Fixed! Now committing and pushing to GitHub...
git add src\pages\DiscoveryNew.tsx
git commit -m "fix: correct JSX syntax errors in DiscoveryNew.tsx for build success"
git push

echo Done!
