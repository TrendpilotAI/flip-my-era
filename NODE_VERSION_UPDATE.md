# Node Version Update Summary

## Problem
Netlify build was failing due to Node version mismatch:
- **Current**: Node v18.20.8 (specified in netlify.toml)
- **Required**: Node ^20.17.0 or >=22.9.0 (required by `read-cmd-shim@6.0.0` dependency)

## Solution Applied

Updated Node version to **20.17.0** across all configuration files:

### 1. ✅ netlify.toml
- Updated `NODE_VERSION` from `"18"` to `"20.17.0"`

### 2. ✅ .nvmrc
- Created `.nvmrc` file with `20.17.0` for local development and Netlify detection

### 3. ✅ package.json
- Added `engines` field: `"node": ">=20.17.0"` to enforce Node version requirement

### 4. ✅ .github/workflows/ci.yml
- Updated `NODE_VERSION` environment variable from `'18'` to `'20.17.0'`

## Next Steps

1. **Commit and push** these changes
2. **Netlify** will automatically detect the new Node version from `.nvmrc` or `netlify.toml`
3. **GitHub Actions** will use Node 20.17.0 for CI/CD pipelines
4. **Local development**: Run `nvm use` (if using nvm) to switch to Node 20.17.0

## Verification

After deploying, check the build logs to confirm:
- ✅ Node v20.17.0 is being used
- ✅ No more EBADENGINE warnings
- ✅ Build completes successfully

## Compatibility Notes

- Node 20.17.0 is an LTS (Long Term Support) version
- Compatible with all current dependencies
- Recommended for production use

