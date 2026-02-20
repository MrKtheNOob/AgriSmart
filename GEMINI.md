# Project Overview

This is a "Precision Crop Planning" platform for Moroccan agriculture, named AgriSmart. The application provides crop recommendations based on soil and climate data for a given location.

It's a web application with a React frontend and a Python FastAPI backend. It utilizes a Large Language Model (LLM) with Retrieval-Augmented Generation (RAG) to provide recommendations.

**Frontend:**
- Built with React, TypeScript, and Vite.
- Uses Leaflet for the interactive map.
- Styled with Tailwind CSS.

**Backend:**
- Built with Python and FastAPI.
- Uses Langchain for the RAG implementation.
- ChromaDB is used as the vector store.
- Fetches soil data from iSDAsoil and climate data from Open-Meteo.

# Building and Running

**Frontend:**
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Build for production: `npm run build`
5. Lint the code: `npm run lint`

**Backend:**
1. Navigate to the `backend` directory.
2. It is recommended to create a virtual environment.
3. Install dependencies: `uv pip install -r requirements.txt` (Note: `requirements.txt` needs to be generated from `pyproject.toml`)
4. Run the development server: `uvicorn hello:app --reload` (Note: The main application file and instance need to be identified. `hello:app` is a placeholder.)

# Development Conventions

- The project follows a typical frontend/backend monorepo structure.
- The frontend code is written in TypeScript and uses React hooks for state management.
- The backend code is written in Python and uses a service-oriented architecture.
- The backend uses asynchronous programming with `asyncio`.
- Environment variables are used for configuration (e.g., API keys). A `.env` file should be created in the `backend` directory.
