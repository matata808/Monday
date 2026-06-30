# Contributing

This project uses a simple branch flow:

- `dev` is the staging branch.
- `main` is the protected release branch.
- feature branches should be merged into `dev` through pull requests.
- `dev` should be merged into `main` only when the app is ready for release.

## Before you open a pull request

- Pull the latest changes from `dev`.
- Create a feature branch from `dev`.
- Make your changes in small commits.
- Run `npm run lint`.
- Run `npm run test:run`.

## Pull request checklist

- Explain what changed.
- Link any related issue or task.
- Mention any follow-up work.
- Make sure lint and tests pass.

## Good repo habits

- Keep generated files out of git.
- Use short, focused branches.
- Prefer small pull requests that are easy to review.
- Keep `main` stable and ready for release.
