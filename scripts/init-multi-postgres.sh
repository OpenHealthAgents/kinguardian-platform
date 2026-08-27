#!/bin/bash
set -e

# Initialize isolated databases for KinGuard and Open Wearables
# Enforces strict database & schema isolation between core KinGuard domain and Open Wearables aggregator.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 1. KinGuard Database & User
    CREATE USER iam_user WITH PASSWORD 'iam_password';
    GRANT ALL PRIVILEGES ON DATABASE kinguard_db TO iam_user;

    -- 2. Open Wearables Isolated Database & User
    CREATE USER open_wearables_user WITH PASSWORD 'open_wearables_password';
    CREATE DATABASE open_wearables_db OWNER open_wearables_user;
    GRANT ALL PRIVILEGES ON DATABASE open_wearables_db TO open_wearables_user;
EOSQL
