# Batch update old light-mode styles to dark glassmorphism design
$files = @(
    "frontend\src\pages\CompanyProfile.jsx",
    "frontend\src\pages\History.jsx",
    "frontend\src\pages\About.jsx",
    "frontend\src\pages\AdminLogin.jsx",
    "frontend\src\pages\VerifyEmail.jsx",
    "frontend\src\pages\Privacy.jsx",
    "frontend\src\pages\Terms.jsx",
    "frontend\src\components\BetaGate.jsx"
)

$replacements = @{
    "bg-white rounded" = "glass-card rounded"
    "bg-white " = "glass-card "
    "bg-gray-50" = "bg-dark-bg"
    "bg-gray-100" = "bg-white/10"
    "bg-gray-200" = "bg-white/20"
    "bg-gray-800" = "glass-card"
    "bg-gray-900" = "bg-dark-bg-elevated"
    "border-gray-200" = "border-white/10"
    "border-gray-300" = "border-dark-border"
    "border-gray-700" = "border-dark-border"
    "border-gray-50" = "border-dark-border-subtle"
    "text-gray-300" = "text-dark-text-muted"
    "text-gray-400" = "text-dark-text-secondary"
    "text-gray-500" = "text-dark-text-secondary"
    "text-gray-600" = "text-dark-text-secondary"
    "text-gray-700" = "text-dark-text"
    "text-gray-800" = "text-dark-text"
    "text-gray-900" = "text-white"
    "text-teal-400" = "text-aligned"
    "text-teal-500" = "text-aligned"
    "text-teal-600" = "text-aligned"
    "text-teal-700" = "text-aligned"
    "text-teal-800" = "text-gradient"
    "bg-teal-50" = "bg-aligned/10"
    "bg-teal-500" = "bg-aligned"
    "bg-teal-600" = "bg-aligned"
    "bg-teal-700" = "bg-aligned/90"
    "border-teal-200" = "border-aligned/30"
    "border-teal-500" = "border-aligned"
    "ring-teal-200" = "ring-aligned/20"
    "ring-teal-500" = "ring-aligned"
    "bg-red-50" = "bg-danger/10"
    "text-red-600" = "text-danger"
    "text-red-700" = "text-danger"
    "border-red-200" = "border-danger/30"
    "bg-green-50" = "bg-aligned/10"
    "text-green-600" = "text-aligned"
    "text-green-700" = "text-aligned"
    "bg-yellow-50" = "bg-warning/10"
    "text-yellow-600" = "text-warning"
    "text-yellow-700" = "text-warning"
    "border-yellow-200" = "border-warning/30"
}

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating $file..."
        $content = Get-Content $file -Raw
        $modified = $content
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $modified = $modified -replace [regex]::Escape($pattern), $replacement
        }
        
        if ($modified -ne $content) {
            Set-Content $file -Value $modified -NoNewline
            Write-Host "  Updated"
        } else {
            Write-Host "  No changes needed"
        }
    } else {
        Write-Host "  File not found: $file"
    }
}

Write-Host "Done!"
