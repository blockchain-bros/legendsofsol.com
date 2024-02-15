# Drop the existing database
docker exec -it legends_postgres_1 psql -U postgres -c "DROP DATABASE IF EXISTS legends_dev;"

# Create a new database
docker exec -it legends_postgres_1 psql -U postgres -c "CREATE DATABASE legends_dev;"

# Copy the file to backup.sql
docker cp $(ls ./scripts/prod-db* | tail -n 1) legends_postgres_1:/backup.sql

# Restore the database from the backup
docker exec -it legends_postgres_1 psql -U postgres -d legends_dev -f /backup.sql
