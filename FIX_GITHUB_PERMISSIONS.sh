#!/bin/bash
# Fix GitHub CLI Permissions for PR Creation
# Run this script to re-authenticate with proper permissions

echo "🔧 GitHub CLI Permission Fix"
echo "============================"
echo ""
echo "Current issue: GitHub App token lacks 'repo' scope needed for PR creation"
echo ""

# Option 1: Interactive web login (Recommended)
echo "Option 1: Interactive Web Login"
echo "This will open your browser to authenticate:"
echo "  gh auth login --web"
echo ""

# Option 2: Personal Access Token
echo "Option 2: Use Personal Access Token"
echo "1. Create PAT at: https://github.com/settings/tokens"
echo "2. Select scope: 'repo' (full control)"
echo "3. Then run:"
echo "   gh auth login --with-token <<< 'YOUR_PAT_TOKEN'"
echo ""

# Option 3: Environment variable (for CI/CD)
echo "Option 3: Set GITHUB_TOKEN environment variable"
echo "  export GITHUB_TOKEN=your_pat_token"
echo "  gh pr create ..."
echo ""

echo "After re-authenticating, verify with:"
echo "  gh api user --jq .login  # Should return your username"
echo "  gh pr list --limit 1     # Should show PRs"
echo ""

# Uncomment to run interactive login automatically:
# gh auth login --web
