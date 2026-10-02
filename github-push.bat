@echo off
cd "C:\Users\krish\Downloads\shit dump temp\Jarvis 3.0 Pokemon theme"

echo ==========================================
echo Kanto League - Jarvis Hackathon 3.0
echo GitHub Push Script
echo ==========================================

:: Initialize git repo if not already
if not exist .git (
    echo Initializing git repo...
    git init
)

:: Add all files
echo Adding all files...
git add .

:: Commit changes
echo Committing changes...
git commit -m "Kanto League - Jarvis Hackathon 3.0 - Complete Phase 1-4 with all fixes"

:: Add remote (replace URL if needed)
echo Adding remote origin...
git remote add origin https://github.com/RyanKeshary/jarivs-3.0-pokemon.git 2>nul

:: Push to main
echo Pushing to GitHub...
git push -u origin main

echo.
echo ==========================================
echo Push complete!
echo ==========================================

:: Instructions for next steps
echo.
echo Next steps:
echo 1. Go to https://github.com/RyanKeshary/jarivs-3.0-pokemon.git
echo 2. Verify all files are uploaded
echo 3. Set up GitHub Secrets if needed (SUPABASE_KEY, DATABASE_URL)
echo 4. Enable GitHub Actions in the repository settings
echo 5. Run the project locally: npm run dev
echo ==========================================
pause