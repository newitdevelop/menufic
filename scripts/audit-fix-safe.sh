#!/bin/bash
set -e

echo "========================================="
echo "🔍 Checking for safe security patches..."
echo "========================================="

# Run audit and capture output
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)

# Check if there are any vulnerabilities
TOTAL_VULNS=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")

if [ "$TOTAL_VULNS" -eq 0 ]; then
    echo "✅ No vulnerabilities found. Skipping npm audit fix."
    exit 0
fi

echo "📊 Found $TOTAL_VULNS total vulnerabilities"
echo ""

# Run audit fix in dry-run mode to see what would be fixed
echo "========================================="
echo "🧪 Testing what npm audit fix would do..."
echo "========================================="
npm audit fix --dry-run --json > /tmp/audit-fix-dry-run.json 2>/dev/null || true

# Check if dry-run would make any changes
ACTIONS=$(jq -r '.actions | length' /tmp/audit-fix-dry-run.json 2>/dev/null || echo "0")

if [ "$ACTIONS" -eq 0 ]; then
    echo "⚠️  No safe patches available (would require breaking changes)"
    echo "ℹ️  See SECURITY_UPDATES.md for manual update instructions"
    exit 0
fi

echo "✅ Found $ACTIONS safe patches to apply"
echo ""

# Show what will be fixed
echo "========================================="
echo "📦 Packages that will be updated:"
echo "========================================="
jq -r '.actions[] | .action + ": " + (.module // "unknown")' /tmp/audit-fix-dry-run.json 2>/dev/null || true
echo ""

# Apply the fixes with verbose output
echo "========================================="
echo "🔧 Applying safe security patches..."
echo "========================================="
npm audit fix --loglevel=verbose

echo ""
echo "========================================="
echo "✅ Security patches applied successfully"
echo "========================================="

# Show final status
echo ""
echo "📊 Final vulnerability status:"
npm audit || true
