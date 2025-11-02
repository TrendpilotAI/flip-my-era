# GitHub CLI Permissions Setup

## Current Status
- ✅ GitHub CLI is authenticated
- ❌ Current token lacks permissions to create PRs
- Error: "Resource not accessible by integration"

## Problem
The current GitHub token is a GitHub App installation token with limited permissions. It cannot create pull requests automatically.

## Quick Fix

The current token is a GitHub App token with limited permissions. To enable PR creation, you need to authenticate with a token that has `repo` scope.

**Fastest Method:**
```bash
# Option 1: Interactive web login (recommended)
gh auth login --web

# Option 2: Use Personal Access Token
gh auth login --with-token <<< 'YOUR_PAT_TOKEN'
```

## Solution Options

### Option 1: Re-authenticate with Personal Access Token (Recommended)

1. **Create a Personal Access Token (PAT)**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Select scopes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
   - Generate and copy the token

2. **Authenticate GitHub CLI with PAT**:
   ```bash
   cd /workspace
   export GITHUB_TOKEN=your_personal_access_token
   gh auth login --with-token <<< "$GITHUB_TOKEN"
   ```

   Or interactively:
   ```bash
   gh auth login
   # Select: GitHub.com
   # Select: HTTPS
   # Select: Paste an authentication token
   # Paste your PAT
   ```

### Option 2: Update GitHub App Permissions

If you're using a GitHub App, you need to:
1. Go to your GitHub App settings
2. Update permissions to include:
   - **Repository permissions**: 
     - Contents: Read/Write
     - Pull requests: Read/Write
     - Metadata: Read (automatic)
3. Update the app installation to grant these permissions

### Option 3: Use GITHUB_TOKEN Environment Variable

If you have a token with proper permissions:
```bash
export GITHUB_TOKEN=your_token_with_repo_and_pr_permissions
gh pr create --base main --head feat/prod-readiness --title "..." --body "..."
```

## Required Scopes for PR Creation

- `repo` - Full repository access (includes PR creation)
- OR
- `public_repo` - Public repository access (if repo is public)
- `pull_requests:write` - Write access to pull requests

## Verify Permissions

After re-authenticating, verify:
```bash
gh auth status
gh api user --jq .login
gh pr list --limit 1
```

If all commands work, you have proper permissions.

## Current Token Info

- Token type: GitHub App installation token
- Prefix: `ghs_` (indicates GitHub App)
- Issue: Limited scope for repository operations
