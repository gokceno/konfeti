# Publishing Guide

This document explains how to publish the Konfeti package to npm and GitHub Packages using the automated GitHub Actions workflow.

## Overview

The publishing workflow (`publish.yml`) automatically publishes your package to both:
- **npm** (public registry)
- **GitHub Packages** (GitHub's package registry)

## Prerequisites

### 1. npm Token

You need to create an npm access token and add it to your GitHub repository secrets.

#### Steps to create npm token:

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Click on your profile icon → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** type (for CI/CD publishing)
5. Copy the generated token

#### Add token to GitHub:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

### 2. GitHub Token

The `GITHUB_TOKEN` is automatically provided by GitHub Actions. No setup required!

### 3. Package Configuration

Ensure your `package.json` has the correct configuration:

```json
{
  "name": "@gokceno/konfeti",
  "version": "0.1.0",
  "repository": "git+https://github.com/gokceno/konfeti.git",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org"
  }
}
```

For GitHub Packages, you may want to add an `.npmrc` file in your project root (optional):

```
@gokceno:registry=https://npm.pkg.github.com
```

## How to Publish

### Method 1: Create a GitHub Release (Recommended)

This is the preferred method as it creates a tagged release with release notes.

1. Go to your GitHub repository
2. Click on **Releases** → **Draft a new release**
3. Click **Choose a tag** and create a new tag (e.g., `v0.1.0`)
4. Fill in the release title and description
5. Click **Publish release**

The workflow will automatically trigger and publish to both npm and GitHub Packages.

### Method 2: Manual Workflow Dispatch

Trigger the workflow manually from GitHub Actions tab.

1. Go to **Actions** tab in your repository
2. Select **Publish Package** workflow
3. Click **Run workflow**
4. Optionally specify a version (or leave empty to use package.json version)
5. Click **Run workflow**

## Workflow Steps

The automated workflow performs the following steps:

### Publishing Job

1. **Checkout code** - Gets the latest code from your repository
2. **Setup Node.js** - Installs Node.js 20
3. **Install dependencies** - Runs `npm ci` for clean install
4. **Run tests** - Executes tests if available (skipped if no test script)
5. **Publish to npm** - Publishes package to npm registry
6. **Publish to GitHub Packages** - Publishes package to GitHub Packages

### Verification Job

1. **Wait for availability** - Waits 30 seconds for package to propagate
2. **Verify npm** - Confirms package is available on npm
3. **Verify GitHub Packages** - Confirms package is available on GitHub Packages

## Version Management

### Before Publishing

Always update the version in `package.json` before publishing:

```bash
# Patch version (0.1.0 → 0.1.1)
npm version patch

# Minor version (0.1.0 → 0.2.0)
npm version minor

# Major version (0.1.0 → 1.0.0)
npm version major
```

This will:
- Update `package.json`
- Create a git commit
- Create a git tag

Then push the changes and tag:

```bash
git push && git push --tags
```

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

## Installing Published Packages

### From npm

```bash
npm install @gokceno/konfeti
```

### From GitHub Packages

Users need to configure their `.npmrc`:

```
@gokceno:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install:

```bash
npm install @gokceno/konfeti
```

## Troubleshooting

### Publishing Fails

**Error: "You cannot publish over the previously published versions"**
- Solution: Update the version in `package.json`

**Error: "npm ERR! code E401" (npm)**
- Solution: Check that `NPM_TOKEN` secret is correctly set in GitHub repository settings
- Verify the token has not expired

**Error: "npm ERR! 404 Not Found - PUT https://npm.pkg.github.com/@gokceno%2fkonfeti"**
- Solution: Ensure your repository is public or you have proper permissions
- Check that the package name matches your GitHub username/organization

### Verification Fails

**Package not found during verification**
- The package may need more time to propagate. The workflow waits 30 seconds, but sometimes it takes longer
- Check manually after a few minutes

### Permission Issues

Ensure the workflow has the correct permissions in `.github/workflows/publish.yml`:

```yaml
permissions:
  contents: read
  packages: write
  id-token: write
```

## Best Practices

1. **Test locally before publishing**
   ```bash
   npm pack
   # This creates a .tgz file you can test
   ```

2. **Use release branches**
   - Create a `release` branch for stable releases
   - Test thoroughly before merging to main

3. **Keep a CHANGELOG**
   - Document all changes between versions
   - Include in release notes

4. **Tag releases properly**
   - Use semantic version tags (v1.0.0, v1.1.0, etc.)
   - Include "v" prefix for clarity

5. **Review before publishing**
   - Check `package.json` version
   - Verify all tests pass
   - Review changes since last version

## Continuous Deployment Strategy

### Development Flow

```
feature branch → PR → main → test → create release → auto-publish
```

### Recommended Workflow

1. Create feature branch
2. Make changes and commit
3. Open Pull Request
4. Review and merge to main
5. Update version with `npm version`
6. Push changes and tags
7. Create GitHub Release
8. Workflow automatically publishes

## Security Considerations

1. **Never commit tokens** - Always use GitHub Secrets
2. **Use scoped tokens** - npm automation tokens are preferable
3. **Enable 2FA** - On both npm and GitHub accounts
4. **Review dependencies** - Run `npm audit` before publishing
5. **Sign commits** - Consider GPG signing for releases

## Monitoring

After publishing, monitor:

1. **npm download stats**: https://www.npmjs.com/package/@gokceno/konfeti
2. **GitHub Package insights**: In your repository's Packages section
3. **GitHub Actions logs**: For any errors or warnings

## Rolling Back a Release

If you need to unpublish or fix a bad release:

### npm
```bash
# Unpublish a specific version (only within 72 hours)
npm unpublish @gokceno/konfeti@0.1.0

# Deprecate a version (recommended instead of unpublishing)
npm deprecate @gokceno/konfeti@0.1.0 "This version has critical bugs, use 0.1.1+"
```

### GitHub Packages
- Delete the package version from the Packages section in your repository
- Note: This may affect users who have already installed it

### Better approach:
1. Publish a patch version with the fix
2. Deprecate the buggy version
3. Update documentation

## Support

For issues with:
- **GitHub Actions**: Check the Actions tab for detailed logs
- **npm publishing**: Visit https://docs.npmjs.com/
- **GitHub Packages**: Visit https://docs.github.com/packages

## Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)