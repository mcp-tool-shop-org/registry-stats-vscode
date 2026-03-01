# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

This extension runs inside VS Code and makes **read-only HTTP requests** to public registry APIs.

- **Data touched:** Package metadata from npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub public APIs. Cached stats stored in VS Code `globalState` (local to user profile).
- **Data NOT touched:** Source code, credentials, environment variables, file system contents (beyond reading manifest files like `package.json`).
- **Network egress:** Read-only GET/POST requests to public registry APIs only. No data is sent upstream — the extension only fetches download counts.
- **No secrets handling** — the optional Docker Hub token is stored in VS Code settings (user-managed). The extension does not read, generate, or transmit any other credentials.
- **No telemetry** is collected or sent.
- **Permissions:** No file system write access. No terminal access. No workspace trust requirements beyond reading manifest files.
