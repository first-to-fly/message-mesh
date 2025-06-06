# GitHub Workflows & Automation

This directory contains GitHub Actions workflows and automation for the Message-Mesh project.

## 🔄 Workflows Overview

### CI/CD Workflows

#### 1. **CI Pipeline** (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests
- **Test & Lint**: Runs with Bun

#### 2. **Release Pipeline** (`release.yml`)
**Triggers:** Git tags (`v*`), Manual workflow dispatch
- **Validation**: Full test suite, version validation
- **Build**: Creates release artifacts and checksums
- **NPM Publishing**: Publishes to npm registry
- **GitHub Release**: Creates GitHub release with changelog
- **Notifications**: Success/failure notifications


#### 4. **Code Quality** (`quality.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests, Weekly
- **Code Analysis**: ESLint, TypeScript, complexity metrics
- **Performance Benchmarks**: Bundle size, memory usage, load time
- **Documentation Quality**: Coverage and link checking
- **Quality Gates**: Combined quality scoring

#### 5. **PR Automation** (`pr-automation.yml`)
**Triggers:** PR events, Issue comments
- **PR Validation**: Title format, description checks
- **Auto Labeling**: Size, type, and scope labels
- **Conflict Detection**: Merge conflict alerts
- **Command Handler**: Bot commands (`/rerun`, `/ready`, `/hold`)
- **Auto Assignment**: Reviewer assignment based on changes

### Automation Features

#### 🏷️ **Automatic Labeling**
- **Size Labels**: `size/XS` through `size/XL` based on line changes
- **Type Labels**: `documentation`, `testing`, `ci/cd`, `dependencies`, etc.
- **Status Labels**: `needs-review`, `merge-conflict`, `do-not-merge`

#### 🤖 **Bot Commands**
Use these commands in PR comments:
- `/rerun` or `/rerun-ci` - Trigger CI re-run
- `/ready` - Mark draft PR as ready for review
- `/hold` - Add "do not merge" label
- `/unhold` - Remove "do not merge" label

#### 📊 **Quality Metrics**
- **Bundle Size**: ≤ 100KB limit enforced
- **Test Coverage**: ≥ 80% minimum required
- **Code Quality**: ESLint error count tracking
- **Performance**: Memory usage and load time monitoring

#### 🔒 **Security Features**
- **Dependency Scanning**: Daily vulnerability checks
- **License Compliance**: Forbidden license detection
- **Code Scanning**: CodeQL and Trivy analysis
- **Scorecard**: OpenSSF security best practices

## 📋 Issue Templates

### Bug Report (`bug_report.yml`)
Structured template for bug reports with:
- Platform selection (WhatsApp, Messenger, Instagram)
- Runtime environment details
- Reproduction steps
- Code samples

### Feature Request (`feature_request.yml`)
Comprehensive template for new features:
- Problem statement and proposed solution
- Platform scope and use cases
- API design proposals
- Implementation complexity estimation

### Documentation (`documentation.yml`)
Template for documentation issues:
- Documentation type and location
- Current vs. proposed content
- Target audience identification

## 🔧 Configuration Files

### CODEOWNERS
Defines automatic review assignment:
- Core team reviews for all changes
- Platform-specific expertise for services
- Security review for sensitive files

### Dependabot (`dependabot.yml`)
Automated dependency management:
- Weekly updates on Mondays
- Grouped updates for related dependencies
- GitHub Actions version updates
- Automatic PR creation with proper labels

### Pull Request Template
Comprehensive PR checklist covering:
- Change type classification
- Testing requirements
- Documentation updates
- Platform compatibility
- Security considerations

## 🚀 Getting Started

### For Contributors

1. **Fork and Clone**: Standard GitHub workflow
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow code style and add tests
4. **Run Local Checks**: `bun run validate`
5. **Create PR**: Use provided template
6. **Wait for CI**: All checks must pass
7. **Address Feedback**: Respond to review comments

### Local Development Commands

```bash
# Run full CI pipeline locally
bun run ci

# Run with coverage
bun run ci:coverage

# Check bundle size
bun run size-check

# Security audit
bun run audit

# Validate everything
bun run validate
```

### Release Process

1. **Version Bump**: Update `package.json` version
2. **Create Tag**: `git tag v1.0.0 && git push origin v1.0.0`
3. **Automatic Release**: Workflow creates GitHub release and publishes to npm
4. **Verify**: Check npm and GitHub releases

## 📈 Monitoring & Alerts

### CI/CD Metrics
- **Build Success Rate**: Track in Actions tab
- **Test Coverage**: Reports in PR comments
- **Bundle Size**: Tracked in CI summaries
- **Security Score**: OpenSSF Scorecard results

### Quality Gates
All PRs must pass:
- ✅ TypeScript compilation
- ✅ ESLint without errors
- ✅ All tests passing
- ✅ Bundle size under limit
- ✅ Security scans clean

### Notifications
- **Release Success**: Automatic notifications
- **Security Issues**: Alert on vulnerabilities
- **Quality Failures**: PR status checks
- **Dependency Updates**: Weekly PR creation

## 🛠️ Maintenance

### Weekly Tasks
- Review dependabot PRs
- Check security scan results
- Monitor quality metrics
- Update documentation as needed

### Monthly Tasks
- Review and update CI/CD workflows
- Analyze performance trends
- Update automation rules
- Security configuration review

## 🔍 Troubleshooting

### Common Issues

**CI Failures:**
- Check workflow logs in Actions tab
- Verify all required secrets are set
- Ensure branch protection rules are met

**Release Failures:**
- Verify NPM_TOKEN secret is valid
- Check package.json version matches tag
- Ensure all tests pass

**Security Alerts:**
- Review dependabot security advisories
- Check Trivy and CodeQL results
- Update vulnerable dependencies

### Support
- Check existing issues and discussions
- Review workflow documentation
- Contact maintainers for complex issues

---

**Last Updated**: Auto-generated from CI/CD setup
**Maintained By**: @first-to-fly