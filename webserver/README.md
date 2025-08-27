# 3kpro Webserver (Express)

This project is a minimal Express-based webserver designed to host multiple static sites and small web apps from the `sites/` folder. It's built for easy development and deployment.

Overview (what you'll find):

- `index.js` - main server. Serves static sites at `/site/:name` and mounts small express apps at `/app/:name`.
- `sites/` - place each site or app in its own subfolder. Use `public/` for static files and `app.js` to export an Express router for dynamic apps.

Quick start (Windows PowerShell):

```powershell
cd path\to\webserver
npm install
npm start
```

Then open http://localhost:3000

Instructor-style walkthrough:

1) Project initialization

- We added a `package.json` with `express` and `nodemon` (dev). `express` is the web framework. `nodemon` restarts the server automatically during development.

2) `index.js` structure

- Create Express app and set constants (port, sites directory). This centralizes configuration so we can change the base folder or port easily.
- Logging middleware prints simple request info for learning and debugging.
- `/health` endpoint is a tiny health check used by deployment platforms and for quick verification.
- `/` root returns a small HTML index linking example sites.
- `/site/:name` uses `express.static` to serve files out of `sites/:name/public`. This is a simple pattern: each site has a `public` folder like any static site generator would produce.
- `/app/:name` attempts to require `sites/:name/app.js` and, if present, delegates the request. This allows packaging small express apps per folder.

3) Adding a new static site

- Create `sites/my-site/public/index.html` and any assets. Visit `/site/my-site`.

4) Adding a new express app

- Create `sites/my-app/app.js` and export a Router or middleware function. Visit `/app/my-app`.

5) Deployment notes

- This server runs on Node 18+ and is deployable to many hosts (Azure App Service, Azure Container Apps, Heroku, DigitalOcean, Docker). For containers, a simple `Dockerfile` can be added.
- For modern deployments, prefer a container. The server listens on `process.env.PORT`, which platforms set automatically.

Next steps I can do for you (pick any):

- Add a Dockerfile and sample GitHub Actions workflow to build and push an image.
- Add HTTPS via a reverse proxy example (nginx) and a TLS self-signed dev config.
- Add a simple admin UI to upload or enable sites.

Docker & CI

This repository includes a `Dockerfile` for building a production container and a GitHub Actions workflow in `.github/workflows/docker-publish.yml` that builds and pushes the image to GitHub Container Registry (GHCR) when you push to `main`.

Build and run locally with Docker:

```powershell
# from project root
docker build -t 3kpro-webserver:local .
docker run -p 3000:3000 3kpro-webserver:local
```

CI notes:
- The workflow uses the built-in `GITHUB_TOKEN` to authenticate to GHCR and push an image tagged `ghcr.io/<owner>/3kpro-webserver:latest`.
- If your organization requires a PAT, create a secret and adjust the `password` in the login step.

HTTPS reverse proxy (nginx) and self-signed cert (dev)

Files added:

- `nginx/conf.d/default.conf` — nginx config that redirects HTTP → HTTPS and proxies to the web service.
- `certs/` — directory to hold `server.crt` and `server.key` for nginx.
- `scripts/make-self-signed-cert.ps1` — helper to create a self-signed cert (Windows PowerShell). You may still need OpenSSL to extract a PEM key.

Run locally with Docker Compose (development):

```powershell
# builds web image and runs nginx proxy
docker-compose up --build
# then open: https://localhost (accept self-signed cert warning)
```

Admin UI

An admin UI was added at `/admin` (static files in `admin/public`) with an API under `/admin/api/sites` to list sites and toggle enabled state. Enabling/disabling creates/removes a `.disabled` marker file inside each site folder.

Example admin actions (PowerShell):

```powershell
# list sites
# Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/admin/api/sites | ConvertFrom-Json

# disable a site
# Invoke-RestMethod -Method Post -Uri http://localhost:3000/admin/api/sites/example-static/enable -Body (@{enabled=$false}|ConvertTo-Json) -ContentType 'application/json'
```

