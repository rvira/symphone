# Public release checklist

- Confirm you own or have permission to publish every contribution. Repository checks are not a legal ownership review.
- Keep the root license and third-party notices with distributions. Review sample and font licenses separately before mirroring assets.
- Run `npm ci`, `npm test`, `npm run build` and `npm audit`. Listen to changes affecting sound in a browser.
- Review tracked files and Git history for secrets and private data. Rotate exposed credentials; deleting a current file does not remove it from history.
- In GitHub Settings → Security, enable private vulnerability reporting. It was disabled during preparation.
- After CI succeeds, consider requiring pull requests and the CI checks for `main`. Review secret-scanning and Dependabot alerts.
- Confirm the README, contribution guide, security policy and repository description match the release.
- Tag a version and create a GitHub release only when ready. Pushing preparation files does not create a release or change repository settings.
