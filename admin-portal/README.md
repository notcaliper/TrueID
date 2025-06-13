# TrueID Government Portal

The government portal is a secure web application that allows government officials to manage and verify citizen identities in the TrueID system.

## Features

- Secure authentication for government officials
- Identity verification and management
- Document verification system
- Audit logging and compliance tracking
- Real-time identity status monitoring
- Integration with blockchain for immutable records

## Tech Stack

- React.js for frontend
- Node.js/Express for backend
- PostgreSQL for database
- Ethereum blockchain integration
- JWT for authentication
- TailwindCSS for styling

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `backend/env.example`

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Environment Variables

Required environment variables (see `backend/env.example` for details):
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `DB_*`: Database configuration
- `JWT_SECRET`: Secret for JWT tokens
- `BLOCKCHAIN_*`: Blockchain configuration
- `FRONTEND_URL`: Main frontend URL
- `BACKEND_URL`: Backend API URL

## Security Features

- Role-based access control
- Two-factor authentication
- Audit logging
- Rate limiting
- Input validation
- XSS protection
- CSRF protection

## API Documentation

The API documentation is available at `/api-docs` when running the server.

## Contributing

Please follow the contribution guidelines in the main project README.

## License

This project is licensed under the MIT License - see the main project LICENSE file for details. 