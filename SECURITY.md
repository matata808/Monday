# Security Policy

## Supported Branches

Security fixes target `main` first, then flow into `dev` and active feature branches as needed.

## Reporting a Vulnerability

Do not open a public issue for secrets, credential leaks, authentication bypasses, or private data exposure.

Report security concerns privately to the repository owner through GitHub. Include:

- affected files or endpoints,
- steps to reproduce,
- impact,
- suggested fix if known.

## Secret Handling

- Real `.env` files must stay local.
- OAuth credentials, refresh tokens, mail passwords, API keys, and database files must never be committed.
- Use `.env.example` and `.env.docker.example` for placeholders only.
- Local SQLite data belongs under `/data`, which is ignored.

## Baseline Controls

- CI runs lint, tests, coverage, audits, production build, Compose validation, and Docker image builds.
- Security workflow runs CodeQL, dependency review, and secret scanning.
- Dependabot monitors npm and GitHub Actions dependencies.
