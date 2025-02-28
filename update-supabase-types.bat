@echo off
REM Update Supabase Types Script
REM This script helps to manually update Supabase types when you have the Supabase CLI installed

echo === Supabase Types Update ===

REM Check if Supabase CLI is installed
call supabase --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Supabase CLI is not installed. Please install it first:
  echo npm install -g supabase
  exit /b 1
)

REM Request Supabase access token if not provided
if "%~1"=="" (
  set /p SUPABASE_ACCESS_TOKEN="Enter your Supabase access token: "
) else (
  set SUPABASE_ACCESS_TOKEN=%~1
)

REM Project ID for Supabase
set PROJECT_ID=slnjliheyiiummxhrgmk

echo Logging in to Supabase...
call supabase login %SUPABASE_ACCESS_TOKEN%
if %ERRORLEVEL% neq 0 (
  echo Failed to log in to Supabase
  exit /b 1
)

echo Generating TypeScript types...
call supabase gen types typescript --project-id %PROJECT_ID% > src\integrations\supabase\types.ts
if %ERRORLEVEL% neq 0 (
  echo Failed to generate types
  exit /b 1
)

echo Types successfully updated at src\integrations\supabase\types.ts

REM Optionally commit the changes
set /p COMMIT_CHANGES="Do you want to commit the changes? (y/n): "
if /i "%COMMIT_CHANGES%"=="y" (
  git add src\integrations\supabase\types.ts
  git commit -m "chore: update Supabase types"
  echo Changes committed. Use 'git push' to push to remote repository.
)

pause
