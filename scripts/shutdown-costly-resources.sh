#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="project-f993fbd8-b0ef-4f03-a6b"
SERVICE_NAME="backtrack-session-host"
REGION="us-east1"
CLOUD_SDK="$HOME/.local/google-cloud-sdk/bin/gcloud"

if [[ ! -x "$CLOUD_SDK" ]]; then
  echo "Google Cloud SDK not found at $CLOUD_SDK"
  exit 1
fi

echo "This will stop the Cloud Run service and remove the serving resource that incurs runtime cost."
read -r -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "Aborted."
  exit 1
fi

echo "[1/2] Deleting Cloud Run service..."
"$CLOUD_SDK" run services delete "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --quiet

echo "[2/2] Optional cleanup: disabling the live hosting app is not included because it is usually a deliberate frontend publish."
echo "If you want to leave the app fully offline, you can also disable Hosting in Firebase or remove the site from the project console."

echo "\nCostly runtime resources have been shut down."
echo "Static Hosting remains untouched unless you delete it manually from Firebase."
