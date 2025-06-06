# Pull Request

## Summary

<!-- Provide a brief summary of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🧹 Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔧 Build/CI changes
- [ ] 🧪 Test improvements

## Description

<!-- Provide a more detailed description of your changes -->

### What changed?

<!-- Describe what was changed -->

### Why was this change necessary?

<!-- Explain the motivation behind this change -->

### How does this change affect users?

<!-- Describe the impact on end users -->

## Related Issues

<!-- Link to any related issues -->
Fixes #(issue_number)
Closes #(issue_number)
Related to #(issue_number)

## Breaking Changes

<!-- If this introduces breaking changes, describe them here -->

- [ ] This PR introduces breaking changes
- [ ] Migration guide is included in the documentation

## Testing

<!-- Describe how you tested your changes -->

### Test Plan

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

### Testing checklist:

- [ ] ✅ `bun run typecheck` passes
- [ ] ✅ `bun run lint` passes  
- [ ] ✅ `bun test` passes
- [ ] ✅ `bun run build` succeeds

## Platform Testing

<!-- Mark which platforms were tested -->

- [ ] WhatsApp Business API
- [ ] Facebook Messenger
- [ ] Instagram Messaging
- [ ] Universal messaging features
- [ ] Webhook functionality

## Documentation

<!-- Mark relevant documentation updates -->

- [ ] Code changes are documented with JSDoc comments
- [ ] API reference updated (if applicable)
- [ ] README updated (if applicable)
- [ ] Migration guide updated (if breaking changes)
- [ ] Examples updated (if applicable)

## Screenshots/Examples

<!-- If applicable, add screenshots or code examples -->

### Before:
```typescript
// Previous behavior
```

### After:
```typescript
// New behavior
```

## Performance Impact

<!-- Describe any performance implications -->

- [ ] No performance impact
- [ ] Performance improvement
- [ ] Performance regression (justified)

### Bundle Size Impact:

- Current bundle size: X KB
- New bundle size: Y KB
- Change: +/- Z KB

## Security Considerations

<!-- Describe any security implications -->

- [ ] No security impact
- [ ] Security improvement
- [ ] New security considerations (documented)

## Checklist

<!-- Ensure all items are completed before requesting review -->

### Code Quality:
- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code has been performed
- [ ] Code is well-commented, particularly in hard-to-understand areas
- [ ] No console.log statements or debugging code left in

### Testing:
- [ ] Tests for the changes have been added
- [ ] All tests pass locally
- [ ] Test coverage is maintained or improved

### Documentation:
- [ ] Documentation has been updated where necessary
- [ ] Public API changes are documented
- [ ] Breaking changes are clearly documented

### Compatibility:
- [ ] Changes are compatible with both Bun and Node.js
- [ ] Changes maintain backward compatibility (or breaking changes are documented)
- [ ] TypeScript types are updated and accurate

### Review:
- [ ] Ready for review
- [ ] Appropriate reviewers have been requested
- [ ] CI/CD checks are passing

## Additional Notes

<!-- Any additional information for reviewers -->

## Review Focus Areas

<!-- Highlight specific areas where you'd like reviewer attention -->

- [ ] Algorithm/logic correctness
- [ ] Error handling
- [ ] Performance implications
- [ ] Security considerations
- [ ] API design
- [ ] Documentation clarity
- [ ] Test coverage

---

**Reviewer Guide:**
- Focus on the areas marked above
- Check that all tests pass
- Verify documentation is updated
- Test the changes locally if possible
- Consider backward compatibility impact