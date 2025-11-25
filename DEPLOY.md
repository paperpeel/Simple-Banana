
# Nano Banana Pro Studio - Deployment Guide

This is a static frontend application designed to interact with the Gemini API (Nano Banana models).

## Prerequisites

- Docker
- Docker Compose

## Docker Configuration Files

**Note:** Please manually create the following files in your project root directory before deploying.

### 1. nginx.conf

Create a file named `nginx.conf` with the following content:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip for better performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 2. Dockerfile

Create a file named `Dockerfile` with the following content:

```dockerfile
# Use a lightweight Nginx image
FROM nginx:alpine

# Copy the static application files to the Nginx web root
COPY . /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Deployment Steps

1.  **Prepare Files**
    Ensure you have created `Dockerfile` and `nginx.conf` (using the content above) in the same directory as your `index.html` and `docker-compose.yml`.

2.  **Build and Run**
    Run the following command in the terminal:

    ```bash
    docker-compose up -d --build
    ```

3.  **Access the GUI**
    Open your browser and navigate to:
    `http://localhost:8080`

## Configuration

### API Key & Proxy
Since the application runs in the browser, you must configure the API Key and Proxy URL within the application's "Settings" menu (Gear icon).

- **API Key**: Your Google Gemini API Key.
- **Proxy/Base URL**: If you cannot access Google APIs directly, set up a backend proxy that forwards requests to `https://generativelanguage.googleapis.com` and enter your proxy URL here.

## Project Structure for Deployment

The Dockerfile serves the raw `index.html` and TypeScript/React files. The application uses an ES Module based architecture (`importmap`) that runs directly in modern browsers without a complex build step.
