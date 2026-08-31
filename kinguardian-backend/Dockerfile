FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY pyproject.toml ./
RUN pip install --no-cache-dir "fastapi[standard]>=0.115" "sqlalchemy>=2.0" "asyncpg>=0.30" "alembic>=1.14" "pydantic-settings>=2.7" "pyjwt[crypto]>=2.10" "httpx>=0.28"
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./
EXPOSE 8000
CMD ["fastapi", "run", "app/main.py", "--port", "8000"]
