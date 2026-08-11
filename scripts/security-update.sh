#!/bin/bash
# =============================================
# Security & Dependency Update Script
# Run this monthly to keep dependencies safe
# Usage: bash scripts/security-update.sh
# =============================================

set -e

echo "========================================="
echo "🔐 Menufic Security Update"
echo "========================================="
echo ""

# Check ncu is available
if ! npx --yes npm-check-updates --version > /dev/null 2>&1; then
    echo "❌ npm-check-updates not available"
    exit 1
fi

echo "📊 Current vulnerability status:"
npm audit 2>&1 | grep "vulnerabilities" | head -1
echo ""

echo "========================================="
echo "📦 Step 1: Apply patch updates (safe)"
echo "========================================="
npx npm-check-updates --target patch -u --silent
echo "✅ Patch versions updated in package.json"
echo ""

echo "========================================="
echo "📦 Step 2: Apply safe minor updates"
echo "========================================="
# Runtime deps with good backwards-compat track record
npx npm-check-updates -u \
    next-auth \
    fast-average-color \
    "@emotion/react" \
    "@emotion/server" \
    react-qr-code \
    dayjs \
    blurhash \
    browser-image-compression \
    --silent 2>/dev/null || true
echo "✅ Minor versions updated in package.json"
echo ""

echo "========================================="
echo "📦 Step 3: Install updated packages"
echo "========================================="
npm install --legacy-peer-deps

echo ""
echo "========================================="
echo "🔧 Step 4: Apply safe security patches"
echo "========================================="
npm audit fix --legacy-peer-deps || true

echo ""
echo "========================================="
echo "📊 Final vulnerability status:"
echo "========================================="
npm audit 2>&1 | grep -E "vulnerabilities|severity" | head -5

echo ""
echo "========================================="
echo "ℹ️  Remaining unfixable vulnerabilities require major version"
echo "   upgrades (next, nodemailer, @sentry/nextjs, nanoid)."
echo "   These are known and accepted. See package.json overrides"
echo "   for mitigations already in place."
echo "========================================="
echo ""
echo "✅ Security update complete!"
echo "   Commit package.json and package-lock.json, then redeploy."
