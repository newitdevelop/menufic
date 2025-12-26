#!/bin/bash
# Script to check if npm audit fix is needed
# Returns exit code 0 if audit is needed, 1 if not needed

set -e

echo "🔍 Checking if security audit is needed..."

# Run audit and capture output
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)

# Check if there are any vulnerabilities
TOTAL_VULNS=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")

if [ "$TOTAL_VULNS" -eq 0 ]; then
    echo "✅ No vulnerabilities found. Audit not needed."
    exit 1  # Not needed
fi

echo "📊 Found $TOTAL_VULNS total vulnerabilities"

# Run audit fix in dry-run mode to see what would be fixed
npm audit fix --dry-run --json > /tmp/audit-fix-dry-run.json 2>/dev/null || true

# Check if dry-run would make any changes
ACTIONS=$(jq -r '.actions | length' /tmp/audit-fix-dry-run.json 2>/dev/null || echo "0")

if [ "$ACTIONS" -eq 0 ]; then
    echo "⚠️  No safe patches available (would require breaking changes)"
    echo "ℹ️  Audit not needed - only breaking changes exist"
    exit 1  # Not needed
fi

echo "✅ Found $ACTIONS safe patches available"
echo "ℹ️  Audit IS needed"
exit 0  # Audit needed
