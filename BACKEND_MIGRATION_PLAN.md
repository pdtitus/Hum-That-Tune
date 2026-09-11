# Backend Migration Plan

This project currently mixes a generic multiplayer backend with a front-end game app. The backend should be split into its own GitHub repository so it can evolve independently from the game UI and hosting layers.

## 1) What belongs in the new backend repo

The backend is centered on the generic session host in [server.js](server.js). The migration should include:

- [server.js](server.js)
- [package.json](package.json)
- [package-lock.json](package-lock.json)
- [Dockerfile](Dockerfile)
- [.dockerignore](.dockerignore)
- [SERVER_PROTOCOL.md](SERVER_PROTOCOL.md)
- [CLOUD_DEPLOYMENT_SETUP.md](CLOUD_DEPLOYMENT_SETUP.md)
- [README.md](README.md)
- Firebase/Cloud Run deployment notes and any future environment files

The following files are front-end or game-specific and should remain in the original app repo or be cleaned up before backend extraction:

- [app.js](app.js)
- [index.html](index.html)
- [style.css](style.css)
- [songs.json](songs.json)
- [songs517_backup.json](songs517_backup.json)
- [BackTrack_v1.0_Master_Curation.xlsx](BackTrack_v1.0_Master_Curation.xlsx)

## 2) Backend scope and architectural boundary

The current server is intentionally game-agnostic:

- it creates sessions and join codes
- it manages participant tokens and WebSocket connections
- it validates channel permissions
- it enforces host-only state replacement
- it relays opaque events without interpreting them

This makes it a good backend product candidate, separate from the BackTrack game logic and browser UI. The frontend owns game semantics; the backend should stay generic.

## 3) Current deployment facts to carry forward

From the project notes and deployment docs:

- Google Cloud / Firebase project: project-f993fbd8-b0ef-4f03-a6b
- Cloud Run service: backtrack-session-host
- Cloud Run region: us-east1
- Firebase Hosting front-end URL: https://project-f993fbd8-b0ef-4f03-a6b.web.app
- Cloud Run backend URL: https://backtrack-session-host-5uxukeuzmq-ue.a.run.app
- Current backend behavior is in-memory only; sessions are lost on service restart
- CORS allows Firebase Hosting and localhost origins
- Deployment is working for session creation and remote WebSocket connectivity

## 4) Recommended repo split

### New backend repository

Repository name suggestion:

- `session-host-service`
- `hum-that-tune-backend`
- `backtrack-session-host`

The most descriptive choice is likely `backtrack-session-host` if the backend is meant to remain tied to the game family while staying generic in implementation.

### Keep in existing app repo

The front-end app and game logic should remain in the original repo, with the backend URL configured via environment or client config.

## 5) Migration steps

1. Create a new GitHub repository for the backend.
2. Clone the new repository locally.
3. Copy only the backend files listed above into the new repo.
4. Add a backend-focused README describing:
   - session host purpose
   - how to run locally
   - how to create and join sessions
   - how to connect via WebSocket
   - deployment to Cloud Run
5. Add an environment template for configuration such as:
   - `PORT`
   - `ALLOWED_ORIGINS`
6. Remove all game-specific browser code from the new repo.
7. Preserve the current API contract documented in [SERVER_PROTOCOL.md](SERVER_PROTOCOL.md).
8. Ensure the repo history is clean and that the backend has its own commit log independent of the app UI.

## 6) Suggested backend README structure

The backend repo README should include:

- product overview
- architecture summary
- local run instructions
- health endpoint
- session creation and participant join APIs
- WebSocket connection flow
- environment variables
- deployment instructions for Cloud Run
- limitations and next steps such as Firestore persistence or multi-instance scaling

## 7) Suggested git commands

```bash
# create the new repo on GitHub, then:
git clone https://github.com/<owner>/<new-backend-repo>.git
cd <new-backend-repo>

# copy in backend files only
cp /workspaces/Hum-That-Tune/server.js .
cp /workspaces/Hum-That-Tune/package.json .
cp /workspaces/Hum-That-Tune/package-lock.json .
cp /workspaces/Hum-That-Tune/Dockerfile .
cp /workspaces/Hum-That-Tune/.dockerignore .
cp /workspaces/Hum-That-Tune/SERVER_PROTOCOL.md .
cp /workspaces/Hum-That-Tune/CLOUD_DEPLOYMENT_SETUP.md .
cp /workspaces/Hum-That-Tune/README.md .

# stage and commit
git add .
git commit -m "Initial backend service extraction"
git push origin main
```

## 8) Risk and follow-up items

The current backend is operational but intentionally limited. Before or during migration, note the following:

- the session store is in memory only
- active rooms are lost on Cloud Run restart
- security assumptions are still minimal and should be reviewed
- the backend is service-oriented but not yet fully productionized
- Firestore persistence and multi-instance support should be added after API stability is proven

## 9) Recommended next move

The next immediate action is to create the new backend repository and push the extracted service without the front-end game files. After that, re-point the current app to the new backend URL and keep the front-end repo as a separate client deployment.
