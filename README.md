# X-Captcha Server

A NestJS-based CAPTCHA service with client authentication.

## Features

- Multiple CAPTCHA types (currently supporting Click CAPTCHA)
- Client authentication with public/secret key pairs
- PostgreSQL database for challenge storage
- Clean architecture design
- API documentation with Swagger

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- PostgreSQL (v12 or later)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a PostgreSQL database for the application
4. Configure environment variables in `.env` file:

```
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=xcaptcha
DB_SYNCHRONIZE=true

# Application configuration
PORT=3000
NODE_ENV=development
```

5. Run database migrations:

```bash
npm run migration:run
```

6. Start the application:

```bash
npm run start:dev
```

7. Access the API documentation at: http://localhost:3000/api

## Architecture

The project follows clean architecture principles, with the following layers:

- **Domain**: Contains business logic, interfaces, and models
- **Application**: Contains service implementations
- **Infrastructure**: Contains database entities, repositories, controllers, and framework-specific code

## API Endpoints

### Client Management

- `POST /clients` - Create a new client
- `GET /clients` - Get all clients (requires authentication)
- `GET /clients/:id` - Get a client by ID (requires authentication)
- `DELETE /clients/:id` - Deactivate a client (requires authentication)
- `POST /clients/:id/regenerate-keys` - Regenerate client API keys (requires authentication)

### CAPTCHA Operations

- `POST /captcha/generate` - Generate a new CAPTCHA challenge (requires authentication)
- `POST /captcha/verify` - Verify a CAPTCHA solution

## Authentication

The API uses API key authentication. To access protected endpoints, include the client's public key in the `x-api-key` header.

## Development

### Running in Development Mode

```bash
npm run start:dev
```

### Running Tests

```bash
npm run test
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

### Database Migrations

- Generate a new migration:

```bash
npm run migration:generate -- migration-name
```

- Run migrations:

```bash
npm run migration:run
```

- Revert the last migration:

```bash
npm run migration:revert
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.