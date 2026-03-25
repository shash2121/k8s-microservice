# Landing Service (Auth Service)

Landing page and authentication microservice for ShopHub e-commerce platform.

## Features

- Beautiful landing page with features, categories, and deals
- User registration (Sign Up)
- User login with JWT authentication
- Session management
- Auto-redirect to catalog after login
- Demo user for testing

## Tech Stack

- Node.js
- Express.js
- JWT (JSON Web Tokens)
- bcryptjs (password hashing)
- express-session

## Installation

```bash
cd landing-service
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The service will start on `http://localhost:3000`.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/login` | Login page |
| `/signup` | Registration page |

## API Endpoints

### Health Check
```
GET /health
```

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | User login |
| `/api/auth/me` | GET | Get current user |

## Demo Credentials

A demo user is created on startup:

- **Email:** demo@shophub.com
- **Password:** demo123

## Registration Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

## Login Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Response Format

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt-token-here"
  }
}
```

## Environment Variables

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

## Flow

1. User visits landing page (`http://localhost:3000`)
2. User clicks "Sign Up" or "Login"
3. After successful authentication:
   - Token stored in localStorage
   - User redirected to catalog (`http://localhost:3001`)
4. Catalog service uses userId from localStorage for cart operations

## Project Structure

```
landing-service/
├── public/
│   ├── index.html          # Landing page
│   ├── login.html          # Login page
│   ├── signup.html         # Signup page
│   ├── css/
│   │   └── styles.css      # Shared styles
│   └── js/
│       ├── main.js         # Landing page JS
│       ├── login.js        # Login logic
│       └── signup.js       # Signup logic
├── src/
│   ├── models/
│   │   └── User.js         # User model
│   ├── routes/
│   │   └── auth.js         # Auth routes
│   └── app.js              # Main application
├── package.json
└── README.md
```

## License

MIT
