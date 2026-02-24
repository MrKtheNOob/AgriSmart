FROM python:3.11-slim

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY pyproject.toml uv.lock ./

RUN pip install --upgrade pip setuptools wheel
RUN pip install uv

# Install dependencies
RUN uv sync --frozen

# Now copy the rest of the app
COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]