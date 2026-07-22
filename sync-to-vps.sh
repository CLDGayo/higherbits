#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# sync-to-vps.sh — Push HigherBits source to VPS for deployment
#
# Usage:
#   ./sync-to-vps.sh              # Sync source only
#   ./sync-to-vps.sh --deploy     # Sync + install + build + restart on VPS
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load secrets from .env.deploy
if [[ -f "$SCRIPT_DIR/.env.deploy" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/.env.deploy"
    set +a
else
    echo "❌ Missing $SCRIPT_DIR/.env.deploy — copy .env.deploy.example → .env.deploy and fill it in." >&2
    exit 1
fi

: "${VPS_USER:?VPS_USER not set in .env.deploy}"
: "${VPS_HOST:?VPS_HOST not set in .env.deploy}"
: "${VPS_DEST:?VPS_DEST not set in .env.deploy}"
: "${PM2_APP_NAME:=higherbits}" # default pm2 app name if not set
: "${VPS_NODE_OPTIONS:=--max-old-space-size=3072}"
: "${VPS_BUILD_WORKERS:=1}"
: "${VPS_BUILD_DIST_DIR:=.next-release}"

if [[ "${1:-}" == "--deploy" ]]; then
    echo ""
    echo "🔍 Validating the production build locally..."
    corepack pnpm --filter web build
fi

echo ""
echo "📦 Syncing HigherBits source to VPS..."
echo "   From: $SCRIPT_DIR"
echo "   To:   $VPS_USER@$VPS_HOST:$VPS_DEST"
echo ""

# Sync the source code, ignoring node_modules, build outputs, and git
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.pnpm-store' \
    --exclude='.turbo' \
    --exclude='test-results' \
    --exclude='playwright-report' \
    --exclude='dist' \
    --exclude='.env.local' \
    --exclude='.env.deploy' \
    --exclude='.DS_Store' \
    "$SCRIPT_DIR/" \
    "$VPS_USER@$VPS_HOST:$VPS_DEST/"

echo ""
echo "✅ Source synced!"

if [[ "${1:-}" == "--deploy" ]]; then
    echo ""
    echo "🚀 Triggering build and deploy on VPS..."
    
    # Run commands on the VPS via SSH to install dependencies, build, and restart the app
    ssh "$VPS_USER@$VPS_HOST" "
        set -e
        chown -R higherbits:higherbits \"$VPS_DEST\"
        su - higherbits -c '
            set -e
            cd \"$VPS_DEST\"
            echo \"📦 Installing dependencies...\"
            pnpm install
            
            echo \"🔨 Building project...\"
            rm -rf \"apps/web/$VPS_BUILD_DIST_DIR\"
            # Run Next directly so the VPS-only validation override reaches Next instead of
            # being filtered by Turborepo's task environment.
            NODE_OPTIONS=\"$VPS_NODE_OPTIONS\" CIRCLE_NODE_TOTAL=\"$VPS_BUILD_WORKERS\" NEXT_DIST_DIR=\"$VPS_BUILD_DIST_DIR\" SKIP_BUILD_VALIDATION=true pnpm --filter web build
            test -f \"apps/web/$VPS_BUILD_DIST_DIR/BUILD_ID\"
            
            echo \"🔄 Restarting application...\"
            pm2 stop $PM2_APP_NAME || true
            rm -rf apps/web/.next.previous
            if [ -d apps/web/.next ]; then
                mv apps/web/.next apps/web/.next.previous
            fi
            mv \"apps/web/$VPS_BUILD_DIST_DIR\" apps/web/.next
            pm2 restart $PM2_APP_NAME --update-env || PORT=3005 pm2 start pnpm --name \"$PM2_APP_NAME\" -- --filter web start --port 3005
            rm -rf apps/web/.next.previous
            
            echo \"✅ Deployment complete!\"
        '
    "
fi

echo ""
echo "Done."
echo ""
