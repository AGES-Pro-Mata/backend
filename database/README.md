# PostgreSQL 15 Configuration Fix

This directory contains fixes for PostgreSQL 15 compatibility issues that were causing container startup failures.

## Problem

The Pro-Mata infrastructure containers were failing to start with these errors:

```
unrecognized configuration parameter "replacement_sort_tuples" in file "/etc/postgresql/postgresql.conf" line 36
unrecognized configuration parameter "stats_temp_directory" in file "/etc/postgresql/postgresql.conf" line 173  
unrecognized configuration parameter "operator_precedence_warning" in file "/etc/postgresql/postgresql.conf" line 235
```

## Root Cause

These configuration parameters were deprecated or removed in PostgreSQL 15:

- `replacement_sort_tuples` - Removed in PostgreSQL 15 (the replacement sort algorithm was removed)
- `stats_temp_directory` - Deprecated in PostgreSQL 15 (statistics now use shared memory by default)
- `operator_precedence_warning` - Removed in PostgreSQL 15 (operator precedence rules are now fixed)

## Solution

### 1. Created PostgreSQL 15-compatible configuration

**File: `postgresql.conf`**
- Removes all deprecated parameters
- Provides modern PostgreSQL 15 settings
- Optimized for Pro-Mata workload
- Includes proper comments explaining parameter changes

### 2. Updated Dockerfile.database

**Changes:**
- Copies the new configuration to `/etc/postgresql/postgresql.conf`
- Adds initialization script to ensure proper configuration application
- Makes scripts executable

### 3. Infrastructure initialization script

**File: `init-infrastructure.sh`**
- Ensures PostgreSQL 15-compatible configuration is applied
- Backs up any existing problematic configuration
- Provides proper logging for troubleshooting

## Files Added/Modified

```
database/
├── postgresql.conf           # PostgreSQL 15-compatible configuration
├── init-infrastructure.sh    # Initialization script for infrastructure layer
└── README.md                # This documentation

Dockerfile.database           # Updated to include new configuration
```

## Key Configuration Changes

### Removed Parameters (caused failures):
```bash
# These were removed:
# replacement_sort_tuples = 150000     # Removed in PostgreSQL 15
# stats_temp_directory = 'pg_stat_tmp'  # Deprecated in PostgreSQL 15  
# operator_precedence_warning = off     # Removed in PostgreSQL 15
```

### Modern Replacements:
```bash
# Modern equivalents and settings:
shared_buffers = 256MB                 # Memory allocation
work_mem = 4MB                        # Working memory per operation
track_activities = on                 # Statistics tracking (replaces stats_temp_directory)
track_counts = on                     # Query statistics
# No replacement needed for replacement_sort_tuples (algorithm removed)
# No replacement needed for operator_precedence_warning (behavior fixed)
```

## Testing

Run the configuration validation test:
```bash
./test-postgresql-config.sh
```

This will verify:
- No deprecated parameters are present
- Required modern settings are configured
- Configuration syntax is valid

## Deployment

When the database image is built and deployed:

1. The `postgresql.conf` file will be copied to `/etc/postgresql/postgresql.conf`
2. The `init-infrastructure.sh` script will run during container initialization
3. The script will ensure the PostgreSQL 15-compatible configuration is applied
4. PostgreSQL will start successfully without configuration errors

## Backward Compatibility

This configuration is designed to work with:
- PostgreSQL 15.x (target version)
- PostgreSQL 16.x (forward compatible)

It removes only the problematic parameters while maintaining all functional settings.