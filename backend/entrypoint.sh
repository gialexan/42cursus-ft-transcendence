#!/bin/bash

# Migrate database from SQLite3 to PostgreSQL
python src/manage.py makemigrations account
python src/manage.py makemigrations matchmaker
python src/manage.py makemigrations
python src/manage.py migrate

# Start Server
cd src && daphne -b 0.0.0.0 -p 8000 transcendence.asgi:application
