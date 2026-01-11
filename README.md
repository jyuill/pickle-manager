# Pickle Tracker App

A full-stack application for tracking your homemade pickles, recipes, and tasting notes.

## Project Structure

- `backend/`: FastAPI application (Python)
- `frontend/`: React application (Vite + Tailwind CSS)

## Setup Guide

When cloning this repository to a new machine, follow these steps to get running.

### 1. Backend Setup

1.  **Navigate directly into the backend folder**:
    ```bash
    cd backend
    ```

2.  **Create a Virtual Environment**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables**:
    - Create a file named `.env` in the `backend/` directory.
    - Copy the contents from `.env.example`.
    - Update the `DATABASE_URL` to point to your PostgreSQL database.
      ```
      DATABASE_URL=postgresql://username:password@localhost:5432/pickle_app
      ```

5.  **Run the Server**:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

### 2. Frontend Setup

1.  **Navigate to the frontend folder**:
    ```bash
    cd ../frontend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Dev Server**:
    ```bash
    npm run dev
    ```

Visit `http://localhost:5173` to see your app!
