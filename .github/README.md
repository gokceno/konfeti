# GitHub Configuration

This directory contains GitHub-specific configuration files for the Konfeti project.

## Contents

### Workflows

#### `workflows/publish.yml`
Automated publishing workflow that publishes the package to both npm and GitHub Packages.

**Triggers:**
- When a new GitHub Release is created
- Manual workflow dispatch from Actions tab

**What it does:**
1. Runs tests (if available)
2. Publishes to npm registry
3. Publishes to GitHub Packages
4. Verifies both publications succeeded

**Required Secrets:**
- `NPM_TOKEN` - npm automation token for publishing

**Permissions:**
- `contents: read` - Read repository contents
- `packages: write` - Write to GitHub Packages
- `id-token: write` - OIDC token for npm provenance

## Documentation

- **[PUBLISHING.md](../PUBLISHING.md)** - Complete guide to publishing packages
- **[PUBLISHING_QUICKSTART.md](./PUBLISHING_QUICKSTART.md)** - Quick reference for publishing

## Setup Instructions

### First Time Setup

1. **Create npm Token**
   - Go to [npmjs.com](https://www.npmjs.com)
   - Navigate to Access Tokens
   - Generate an Automation token
   
2. **Add Secret to GitHub**
   - Go to repository Settings → Secrets and variables → Actions
   - Create new secret named `NPM_TOKEN`
   - Paste your npm token

3. **Verify Workflow**
   - The workflow file is already configured
   - No changes needed unless customizing behavior

### Publishing a New Version

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Push changes
git push && git push --tags

# 3. Create GitHub Release
# Go to https://github.com/gokceno/konfeti/releases/new
# Select the new tag and publish
```

The workflow will automatically run and publish to both registries.

## Workflow Features

### Automated Publishing
- ✅ Publishes to npm
- ✅ Publishes to GitHub Packages
- ✅ Runs tests before publishing
- ✅ Verifies publication succeeded

### Safety Features
- Uses `npm ci` for reproducible builds
- Only publishes on release creation or manual trigger
- Requires secrets to be properly configured
- Includes verification step

### Manual Control
- Can be triggered manually from Actions tab
- Optional version parameter override
- Useful for republishing or emergency releases

## Maintenance

### Updating Node.js Version

If you need to update the Node.js version used in the workflow:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change this version
```

### Adding Additional Checks

To add linting or additional tests before publishing:

```yaml
- name: Run linter
  run: npm run lint

- name: Run type check
  run: npm run type-check
```

### Customizing Publish Behavior

The workflow can be customized by modifying `workflows/publish.yml`:

- Change registry URLs
- Add pre-publish scripts
- Modify verification logic
- Add Slack/Discord notifications

## Troubleshooting

### Workflow Not Triggering

**Issue:** Workflow doesn't run when creating a release

**Solution:**
- Ensure the workflow file exists in the default branch
- Check that the release type is "created" not "published"
- Verify workflow permissions in repository settings

### Publishing Fails

**Issue:** npm publish returns 401 Unauthorized

**Solution:**
- Verify `NPM_TOKEN` secret is set correctly
- Check token hasn't expired
- Ensure token has publish permissions

**Issue:** GitHub Packages publish fails

**Solution:**
- Verify package name matches repository
- Check repository is public or token has correct permissions
- Ensure `packages: write` permission is set in workflow

### Verification Fails

**Issue:** Package verification step fails

**Solution:**
- Package may need more time to propagate
- Check npm and GitHub Packages manually
- Increase wait time in workflow if needed

## Security

### Secrets Management
- Never commit tokens to repository
- Use GitHub Secrets for sensitive data
- Rotate tokens periodically
- Use scoped/automation tokens, not personal tokens

### Permissions
The workflow uses minimal required permissions:
- Read access to repository contents
- Write access to packages only
- No write access to repository

### Provenance
- The workflow supports npm provenance
- Uses `id-token: write` permission
- Provides supply chain transparency

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Publishing to npm](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## Support

For issues or questions:
1. Check the [PUBLISHING.md](../PUBLISHING.md) guide
2. Review workflow logs in Actions tab
3. Open an issue in the repository