# ==============================================================================
# Stage 1: Builder Stage (Compile dependencies with uv)
# ==============================================================================
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy project definition and lockfile
COPY pyproject.toml uv.lock ./

# Install production dependencies only into virtualenv
RUN uv sync --frozen --no-dev --no-cache

# ==============================================================================
# Stage 2: Final Minimal Runtime Stage
# ==============================================================================
FROM python:3.12-slim AS runtime

WORKDIR /app

# Install minimal runtime shared libraries & healthcheck curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system user for container security
RUN groupadd -g 10001 kinguard && \
    useradd -u 10001 -g kinguard -s /bin/bash -m kinguard

# Copy virtualenv from builder stage
COPY --from=builder --chown=kinguard:kinguard /build/.venv /app/.venv

# Copy application source code
COPY --chown=kinguard:kinguard . .

# Environment configuration
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production

# Switch to non-root user
USER kinguard

# Expose HTTP API port
EXPOSE 8000

# Health check configuration
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health/ready || exit 1

# Default entrypoint launches high-concurrency production ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--log-config", "app/core/logging.py"]
