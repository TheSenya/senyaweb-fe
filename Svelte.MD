| Module | Visibility | When is it read? | Use Case |
| :--- | :--- | :--- | :--- |
| `$env/static/public` | Client & Server | Build Time | Publicly known URLs (e.g., `PUBLIC_BACKEND_URL`). Values are replaced/inlined in the code. |
| `$env/static/private` | Server Only | Build Time | Secrets needed during build or that won't change (e.g., database configs if fixed). |
| `$env/dynamic/public` | Client & Server | Runtime | Public values that might change depending on where you deploy (e.g., Docker environment vars). |
| `$env/dynamic/private` | Server Only | Runtime | Secrets that change per deployment (e.g., database passwords in production). |
