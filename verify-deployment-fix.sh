#!/bin/bash
# Deployment Verification Script for PostgreSQL 15 Configuration Fix
# This script helps verify that the PostgreSQL 15 compatibility fix is working

set -e

echo "🚀 Pro-Mata PostgreSQL 15 Configuration Fix - Deployment Verification"
echo "====================================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "Dockerfile.database" ]; then
    echo "❌ Error: This script must be run from the backend repository root directory"
    echo "   Expected to find: Dockerfile.database"
    exit 1
fi

echo "✅ Running from backend repository root"
echo ""

echo "🔍 Verifying fix files are present..."
REQUIRED_FILES=(
    "database/postgresql.conf"
    "database/init-infrastructure.sh" 
    "database/README.md"
    "Dockerfile.database"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "🧪 Running configuration validation tests..."

# Test 1: PostgreSQL configuration compatibility
echo "Test 1: PostgreSQL 15 configuration compatibility"
if grep -qE "^[[:space:]]*[^#]*(replacement_sort_tuples|stats_temp_directory|operator_precedence_warning)" database/postgresql.conf; then
    echo "❌ FAIL: Configuration contains active deprecated parameters"
    exit 1
else
    echo "✅ PASS: No active deprecated parameters found"
fi

# Test 2: Dockerfile includes fixes
echo "Test 2: Dockerfile.database includes configuration fixes"
if grep -q "COPY database/postgresql.conf /etc/postgresql/postgresql.conf" Dockerfile.database; then
    echo "✅ PASS: Configuration file is copied in Dockerfile"
else
    echo "❌ FAIL: Configuration file copy missing from Dockerfile"
    exit 1
fi

if grep -q "COPY database/init-infrastructure.sh /docker-entrypoint-initdb.d/01-infrastructure-init.sh" Dockerfile.database; then
    echo "✅ PASS: Initialization script is copied in Dockerfile"
else
    echo "❌ FAIL: Initialization script copy missing from Dockerfile"
    exit 1
fi

# Test 3: Required modern settings are present
echo "Test 3: Modern PostgreSQL 15 settings are configured"
REQUIRED_SETTINGS=(
    "shared_buffers"
    "work_mem"
    "wal_level"
    "max_connections"
    "track_activities"
    "track_counts"
)

for setting in "${REQUIRED_SETTINGS[@]}"; do
    if grep -q "^[[:space:]]*${setting}" database/postgresql.conf; then
        echo "✅ Found: $setting"
    else
        echo "⚠️  Missing: $setting (may cause performance issues)"
    fi
done

echo ""
echo "🚧 Next Deployment Steps:"
echo "========================"
echo ""
echo "1. Build the updated database image:"
echo "   docker build -f Dockerfile.database -t norohim/pro-mata-database:v1.2.0 ."
echo ""
echo "2. Push to registry:"
echo "   docker push norohim/pro-mata-database:v1.2.0"
echo ""
echo "3. Update infrastructure repository to use new image:"
echo "   - Update infrastructure Docker stack/compose files"
echo "   - Change from: norohim/pro-mata-database-infrastructure:v1.1.1"
echo "   - Change to: norohim/pro-mata-database:v1.2.0"
echo ""
echo "4. Deploy to environment and verify:"
echo "   - Deploy updated stack"
echo "   - Check container logs for successful startup"
echo "   - Verify no FATAL configuration errors"
echo ""
echo "📋 Expected Results After Deployment:"
echo "====================================="
echo ""
echo "BEFORE (with errors):"
echo "❌ unrecognized configuration parameter \"replacement_sort_tuples\""
echo "❌ unrecognized configuration parameter \"stats_temp_directory\""
echo "❌ unrecognized configuration parameter \"operator_precedence_warning\""
echo "❌ FATAL: configuration file \"/etc/postgresql/postgresql.conf\" contains errors"
echo ""
echo "AFTER (fixed):"
echo "✅ Pro-Mata Infrastructure Database Starting..."
echo "✅ Using PostgreSQL 15-compatible configuration"
echo "✅ Infrastructure initialization completed!"
echo "✅ Starting PostgreSQL with infrastructure configuration..."
echo "✅ PostgreSQL ready and running without errors"
echo ""
echo "🎯 All verification tests PASSED!"
echo "   The PostgreSQL 15 configuration fix is ready for deployment."