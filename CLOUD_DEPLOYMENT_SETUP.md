# Cloud Deployment Setup

This document records the Google Cloud, Firebase, and Cloud Run setup performed for the game-agnostic session host.

## Project

- Google Cloud / Firebase project: `project-f993fbd8-b0ef-4f03-a6b`
- Project number: `811982598457`
- Google account: `nathantitus01@gmail.com`
- Deployment region: `us-east1`
- Firestore database: `titus-game-server-storage-1`
- Setup date: 2026-09-06

## Local CLI setup

The Firebase CLI was run through `npx`:

```sh
npx --yes firebase-tools --version
npx --yes firebase-tools login --no-localhost
```

The Google Cloud CLI was installed in the user home directory because system-wide installation was not available:

```sh
mkdir -p "$HOME/.local"
curl -fL --retry 3 \
  https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz \
  -o /tmp/google-cloud-cli.tar.gz
tar -xzf /tmp/google-cloud-cli.tar.gz -C "$HOME/.local"
"$HOME/.local/google-cloud-sdk/install.sh" \
  --quiet --path-update=false --bash-completion=false
```

Google Cloud authentication and project selection:

```sh
$HOME/.local/google-cloud-sdk/bin/gcloud auth login --no-launch-browser
$HOME/.local/google-cloud-sdk/bin/gcloud config set project project-f993fbd8-b0ef-4f03-a6b
```

## Account and service verification

The following checks passed:

```sh
$HOME/.local/google-cloud-sdk/bin/gcloud projects describe project-f993fbd8-b0ef-4f03-a6b
$HOME/.local/google-cloud-sdk/bin/gcloud billing projects describe project-f993fbd8-b0ef-4f03-a6b
$HOME/.local/google-cloud-sdk/bin/gcloud firestore databases list --project project-f993fbd8-b0ef-4f03-a6b
npx --yes firebase-tools projects:list
npx --yes firebase-tools hosting:sites:list --project project-f993fbd8-b0ef-4f03-a6b
```

Billing was initially linked but the billing account was closed. Cloud Run deployment was retried after the billing account was opened.

The following APIs were enabled:

```sh
$HOME/.local/google-cloud-sdk/bin/gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project project-f993fbd8-b0ef-4f03-a6b
```

## Repository deployment configuration

The following files define deployment behavior:

- `Dockerfile`: production Node.js container for Cloud Run.
- `.dockerignore`: excludes local, repository, and non-runtime files from the image build.
- `firebase.json`: publishes the static frontend through Firebase Hosting and excludes backend source files.
- `.gitignore`: excludes Firebase CLI state in `.firebase/`.

The container was built locally before deployment:

```sh
docker build --tag backtrack-session-host:local .
```

## Cloud Run deployment

The backend was deployed from source with one instance maximum and scale-to-zero enabled:

```sh
$HOME/.local/google-cloud-sdk/bin/gcloud run deploy backtrack-session-host \
  --source . \
  --project project-f993fbd8-b0ef-4f03-a6b \
  --region us-east1 \
  --allow-unauthenticated \
  --min 0 \
  --max 1 \
  --port 8080
```

The first deployment attempt exposed two account configuration issues:

1. The billing account was closed, so Artifact Registry rejected the source build.
2. The default Compute Engine service account could not read the Cloud Run source bucket or write build output.

The source bucket was granted read-only access:

```sh
$HOME/.local/google-cloud-sdk/bin/gcloud storage buckets add-iam-policy-binding \
  gs://run-sources-project-f993fbd8-b0ef-4f03-a6b-us-east1 \
  --member=serviceAccount:811982598457-compute@developer.gserviceaccount.com \
  --role=roles/storage.objectViewer
```

The Compute service account was granted the deployment roles needed by the source-build path:

```sh
$HOME/.local/google-cloud-sdk/bin/gcloud projects add-iam-policy-binding project-f993fbd8-b0ef-4f03-a6b \
  --member=serviceAccount:811982598457-compute@developer.gserviceaccount.com \
  --role=roles/artifactregistry.writer

$HOME/.local/google-cloud-sdk/bin/gcloud projects add-iam-policy-binding project-f993fbd8-b0ef-4f03-a6b \
  --member=serviceAccount:811982598457-compute@developer.gserviceaccount.com \
  --role=roles/logging.logWriter

$HOME/.local/google-cloud-sdk/bin/gcloud projects add-iam-policy-binding project-f993fbd8-b0ef-4f03-a6b \
  --member=serviceAccount:811982598457-compute@developer.gserviceaccount.com \
  --role=roles/serviceusage.serviceUsageConsumer
```

## Firebase Hosting deployment

The current static frontend was deployed to the existing default Hosting site:

```sh
npx --yes firebase-tools deploy --only hosting \
  --project project-f993fbd8-b0ef-4f03-a6b
```

The Hosting URL is:

https://project-f993fbd8-b0ef-4f03-a6b.web.app

The Cloud Run URL is:

https://backtrack-session-host-5uxukeuzmq-ue.a.run.app

## Validation performed

The deployed Cloud Run service passed:

```sh
curl -fsS https://backtrack-session-host-5uxukeuzmq-ue.a.run.app/health
```

It returned an OK status. Session creation over HTTPS passed, and a remote WebSocket connection successfully connected and published an authorized host-channel event.

## Current limitations

- The session store is still in memory. A Cloud Run restart ends active sessions.
- The existing BackTrack frontend is hosted but does not yet use the Cloud Run protocol.
- The Firebase project has no registered Firebase web app; this is not required for the current static Hosting deployment or backend smoke tests.
- Firestore is provisioned but the server does not yet use it as a persistence adapter.
- Cloud Run is configured with a maximum of one instance, appropriate for initial testing rather than horizontal scaling.
