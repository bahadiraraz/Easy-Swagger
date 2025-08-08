# Easy Swagger

A lightweight tool for exploring OpenAPI/Swagger specifications and quickly getting example values for AI tools.

## Features

- **Auto-fetch URLs**: Automatically loads and fetches saved URLs when you return to the app
- **Local Storage Cache**: Remembers your last used URL or file
- **Visual Endpoint Explorer**: Organizes endpoints by tags for easy navigation
- **AI-Ready Format**: Copy endpoint data with example values for quick use with AI assistants
- **One-Click Copy**: Instantly copy endpoint information as JSON

## Getting Started

### Using Bun

```bash
# Clone the repository
git clone https://github.com/bahadiraraz/easy-swagger.git
cd easy-swagger

# Install dependencies with Bun
bun install

# Start the development server
bun dev
```

### Using Docker

```bash
# Clone the repository
git clone https://github.com/bahadiraraz/easy-swagger.git
cd easy-swagger

# Build and start the Docker container
docker-compose up -d

# The application will be available at http://localhost:3000
```

You can also build and run the Docker image directly:

```bash
# Build the Docker image
docker build -t easy-swagger .

# Run the container
docker run -p 3000:3000 easy-swagger
```

## How to Use

1. Enter a Swagger URL or upload a JSON file
2. Browse the organized endpoints
3. Click "Copy" on any endpoint to get AI-ready JSON with example values
4. Paste directly into your AI assistant to quickly work with the API
