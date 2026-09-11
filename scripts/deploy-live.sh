#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_ID="project-f993fbd8-b0ef-4f03-a6b"
SERVICE_NAME="backtrack-session-host"
REGION="us-east1"
HOSTING_SITE="project-f993fbd8-b0ef-4f03-a6b"
CLOUD_SDK="$HOME/.local/google-cloud-sdk/bin/gcloud"

if [[ ! -x "$CLOUD_SDK" ]]; then
  echo "Google Cloud SDK not found at $CLOUD_SDK"
  echo "Install it first, then rerun this script."
  exit 1
fi

if [[ ! -f firebase.json ]]; then
  echo "firebase.json not found in $ROOT_DIR"
  exit 1
fi

if [[ ! -f server.js ]]; then
  echo "server.js not found in $ROOT_DIR"
  exit 1
fi

echo "[1/3] Deploying frontend to Firebase Hosting..."
 npx --yes firebase-tools deploy --only hosting --project "$PROJECT_ID"

echo "[2/3] Deploying backend to Cloud Run..."
 "$CLOUD_SDK" run deploy "$SERVICE_NAME" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --min 0 \
  --max 1 \
  --port 8080

echo "[3/3] Health-checking live services..."
BACKEND_URL=$( "$CLOUD_SDK" run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)' )
curl -fsS "$BACKEND_URL/health"
echo
curl -fsS "https://$HOSTING_SITE.web.app" | head -n 5

echo
printf '\nDeployment complete.\n'
printf 'Frontend: https://%s.web.app\n' "$HOSTING_SITE"
printf 'Backend: %s\n' "$BACKEND_URL"
