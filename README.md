# nj-site-forms-ru

Request forms of the Russian page ru.nj-design.pro. A request is mailed to the Yandex mailbox and not stored here.
Runs on Timeweb App Platform (Node 22, `npm start`, port 8080).

- `POST /lead` — a form request (JSON: kind `call`|`task`, name, phone|contact, time, city, about, page, consent `yes`).
- `GET /pending`, `DELETE /pending?seq=N` (Bearer `POLL_TOKEN`) — how many requests came since the last check, no personal data.

Environment: `SMTP_USER`, `SMTP_PASS` (Yandex app password), `MAIL_TO`, `POLL_TOKEN`, `ALLOWED_ORIGINS` (comma-separated).

Run locally: `cp .env.example .env`, fill it in, `node --env-file=.env server.js`.
