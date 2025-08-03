#!/bin/bash
set -e

echo "🚀 Starting Pro-Mata Backend Application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-promata_user}"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run database migrations if needed
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "🔄 Running database migrations..."
  # Add Flyway or Liquibase migration commands here if needed
fi

# Set default profile if not specified
export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}

echo "🌟 Environment: ${SPRING_PROFILES_ACTIVE}"
echo "📊 Database: ${DB_HOST:-postgres}:${DB_PORT:-5432}/${DB_NAME:-promata}"

# Start the Spring Boot application
echo "🚀 Starting Spring Boot application..."
exec java $JAVA_OPTS \
  -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
  -Dspring.datasource.url=jdbc:postgresql://${DB_HOST:-postgres}:${DB_PORT:-5432}/${DB_NAME:-promata} \
  -Dspring.datasource.username=${DB_USER:-promata_user} \
  -Dspring.datasource.password=${DB_PASSWORD:-promata_pass} \
  -Djwt.secret=${JWT_SECRET:-default-secret-key} \
  org.springframework.boot.loader.JarLauncher