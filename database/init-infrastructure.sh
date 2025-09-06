#!/bin/bash
set -e

echo "🚀 Pro-Mata Infrastructure Database Starting..."
echo "Base Image: norohim/pro-mata-database"
echo "Infrastructure Layer: Production Configuration"

echo "🚀 Starting Pro-Mata Infrastructure PostgreSQL..."
echo "Version: PostgreSQL $(postgres --version)"
echo "Timezone: $(date +'%Z %z')"
echo "Cluster: promata-cluster"

echo "🏗  Infrastructure-specific initialization..."

# Ensure the PostgreSQL 15-compatible configuration is used
if [ -f "/etc/postgresql/postgresql.conf" ]; then
    echo "✅ Using PostgreSQL 15-compatible configuration"
    echo "📝 Configuration location: /etc/postgresql/postgresql.conf"
    
    # Backup any existing configuration and use our fixed one
    if [ -f "$PGDATA/postgresql.conf" ]; then
        echo "🔄 Backing up existing configuration"
        mv "$PGDATA/postgresql.conf" "$PGDATA/postgresql.conf.backup" 2>/dev/null || true
    fi
    
    # Copy our fixed configuration to the data directory
    cp /etc/postgresql/postgresql.conf "$PGDATA/postgresql.conf"
    chown postgres:postgres "$PGDATA/postgresql.conf"
    chmod 600 "$PGDATA/postgresql.conf"
    
    echo "✅ PostgreSQL 15-compatible configuration applied"
else
    echo "⚠️  Warning: PostgreSQL configuration not found at expected location"
fi

# Create directory structure for extensibility
mkdir -p /var/lib/postgresql/scripts
mkdir -p /var/lib/postgresql/backups
mkdir -p /etc/postgresql/conf.d

# Set proper permissions
chown -R postgres:postgres /var/lib/postgresql/scripts 2>/dev/null || true
chown -R postgres:postgres /var/lib/postgresql/backups 2>/dev/null || true

echo "✅ Infrastructure initialization completed!"

echo "🗄  Starting PostgreSQL with infrastructure configuration..."