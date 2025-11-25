
# Nano Banana Pro Studio - Deployment Guide

This is a static frontend application designed to interact with the Gemini API (Nano Banana models).

## Prerequisites

- Docker
- Docker Compose

## Deployment Steps

1.  **Build and Run**
    Run the following command in the project root:

    ```bash
    docker-compose up -d --build
    ```

2.  **Access the GUI**
    Open your browser and navigate to:
    `http://localhost:8080`

## Configuration

### API Key & Proxy
Since the application runs in the browser, you must configure the API Key and Proxy URL within the application's "Settings" menu (Gear icon).

- **API Key**: Your Google Gemini API Key.
- **Proxy/Base URL**: If you cannot access Google APIs directly, set up a backend proxy that forwards requests to `https://generativelanguage.googleapis.com` and enter your proxy URL here.

## Project Structure for Deployment

The Dockerfile simply serves the raw `index.html` and TypeScript/React files. The application uses an ES Module based architecture (`importmap`) that runs directly in modern browsers without a complex build step (Webpack/Vite is not required for this specific setup as per `index.html` configuration).
