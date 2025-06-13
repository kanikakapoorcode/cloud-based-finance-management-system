# Finance Management System - Backend

A robust backend API for managing personal finances, built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**
  - JWT-based authentication
  - User registration and login
  - Protected routes

- **Category Management**
  - Create, read, update, and delete categories
  - Categorize transactions as income or expense
  - Default categories for new users

- **Transaction Management**
  - Record income and expenses
  - Categorize transactions
  - Filter and search transactions
  - Transaction statistics and reports

- **API Features**
  - RESTful API design
  - Error handling
  - Request validation
  - Pagination and filtering
  - Rate limiting

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **API Documentation**: Swagger/OpenAPI (coming soon)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and configure the environment variables (use `.env.example` as a reference):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/finance-management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. The API will be available at `http://localhost:5000`

## Seeding the Database

To populate the database with sample data, run:

```bash
node utils/seed.js
```

This will create:
- A test user (test@example.com / password123)
- Sample categories (income and expense)
- Sample transactions

## API Documentation

### Authentication

#### Register a new user
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Categories

#### Get all categories
```
GET /api/v1/categories
```

#### Create a category
```
POST /api/v1/categories
```

**Request Body:**
```json
{
  "name": "Groceries",
  "type": "expense",
  "icon": "shopping_cart",
  "color": "#4CAF50"
}
```

### Transactions

#### Get all transactions
```
GET /api/v1/transactions
```

**Query Parameters:**
- `type`: Filter by type (income/expense)
- `category`: Filter by category ID
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)
- `sort`: Sort by field (prefix with - for descending)
- `limit`: Limit number of results
- `page`: Page number for pagination

#### Create a transaction
```
POST /api/v1/transactions
```

**Request Body:**
```json
{
  "amount": 100.50,
  "description": "Grocery shopping",
  "date": "2023-06-15",
  "category": "60d21b4667d0d8992e610c85",
  "paymentMethod": "credit_card"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Application environment | development |
| PORT | Port to run the server | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/finance-management |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_EXPIRE | JWT expiration time | 30d |
| JWT_COOKIE_EXPIRE | JWT cookie expiration (days) | 30 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
