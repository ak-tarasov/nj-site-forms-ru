# nj-site-forms-ru

Request forms of the Russian page ru.nj-design.pro. A request is mailed to the Yandex mailbox and not stored here.
Runs on Timeweb App Platform (Node 22, `npm start`, port 8080).

- `POST /lead` — a form request (JSON: kind `call`|`task`, name, phone|contact, time, city, about, page, consent `yes`).
- `GET /pending`, `DELETE /pending?seq=N` (Bearer `POLL_TOKEN`) — how many requests came since the last check, no personal data.

Environment: `SMTP_USER`, `SMTP_PASS` (Yandex app password), `MAIL_TO`, `POLL_TOKEN`, `ALLOWED_ORIGINS` (comma-separated).

Run locally: `cp .env.example .env`, fill it in, `node --env-file=.env server.js`.

## Pool calculation program (pool-pz)

Every path except `/lead`, `/pending`, `/health` is proxied to the private pool-pz program (python, 127.0.0.1:8766), started by `pz/pz.js` → `pz/start.sh`.
- `start.sh` clones pool-pz, hydroscheme and the data repo pool-pz-data into `.pz/` with deploy keys from env `PZ_KEY_APP`, `PZ_KEY_SCHEME`, `PZ_KEY_DATA` (base64 of the private key). No `PZ_KEY_APP` → the program is off, forms work as before.
- The container is wiped on every deploy: objects, logins and the journal live in pool-pz-data; `pz/sync.sh` pushes them every 60 s and on stop.
- System packages (Timeweb `system_dependencies`): git, openssh-client, python3-venv, libreoffice-writer (single PDF).
