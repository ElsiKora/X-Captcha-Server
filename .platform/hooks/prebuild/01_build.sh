#!/bin/bash
set -euo pipefail

cd /var/app/staging

npm ci --include=dev
npm run build
npm prune --omit=dev
