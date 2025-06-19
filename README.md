# Finance Management System (FMS)

A full-stack cloud-based finance management system that helps users track their income, expenses, and financial goals with an intuitive interface and powerful analytics.

## ✨ Features

### Backend (Node.js + Express)
- **User Authentication**
  - JWT-based authentication
  - Secure password hashing with bcrypt
  - Role-based access control
  - Session management with token refresh

- **Financial Management**
  - Income and expense tracking
  - Transaction history with filtering
  - Financial reports and analytics
  - PDF report generation

- **API Features**
  - RESTful API design
  - Request validation
  - Rate limiting and security headers
  - Comprehensive error handling and logging
  - API documentation with Swagger

### Frontend (React + Vite + TypeScript)
- **User Interface**
  - Responsive design with Material-UI v5
  - Interactive dashboards with Recharts
  - Form validation with React Hook Form and Yup
  - Date handling with date-fns
  - PDF export functionality

- **User Experience**
  - Intuitive navigation with React Router v6
  - Real-time updates
  - Toast notifications with react-hot-toast
  - Dark/light theme support
  - Form handling with React Hook Form
  - Responsive tables and data grids

- **State Management**
  - React Context API for global state
  - Local storage for persistent data
  - Optimistic UI updates

## 🛠 Installation

### Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher) or yarn
- MongoDB (v5.x or higher)
- Git

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finance-management-system.git
   cd finance-management-system
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../fms-frontend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `backend` and `fms-frontend` directories
   - Update the values in `.env` files with your configuration

4. Start the development servers:
   ```bash
   # Start backend server (from backend/ directory)
   npm run dev
   
   # Start frontend development server (from fms-frontend/ directory)
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or Yarn
- MongoDB (v6.0 or higher)
- Git

### Frontend Requirements
- React 18+
- TypeScript 5.0+
- Vite 5.0+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kanikakapoor/cloud-based-finance-management-system.git
   cd cloud-based-finance-management-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env  # Update with your configuration
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../fms-frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 📁 Project Structure

```
finance-management-system/
├── backend/                  # Backend server (Node.js/Express)
│   ├── config/              # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── utils/                # Utility functions
│   ├── .env                  # Environment variables
│   └── server.js             # Entry point
│
└── fms-frontend/            # Frontend application (React/Vite/TypeScript)
    ├── public/              # Static files
    ├── src/
    │   ├── assets/          # Images, fonts, etc.
    │   ├── components/       # Reusable UI components
    │   │   ├── Auth/         # Authentication components
    │   │   ├── common/       # Common UI components
    │   │   └── layout/       # Layout components
    │   ├── contexts/         # React Context providers
    │   ├── pages/            # Page components
    │   │   ├── Dashboard/    # Dashboard page
    │   │   ├── Login/        # Login page
    │   │   ├── Signup/       # Signup page
    │   │   └── Transactions/ # Transactions page
    │   ├── services/         # API services
    │   ├── types/            # TypeScript type definitions
    │   ├── utils/            # Helper functions
    │   └── App.tsx           # Main application component
    ├── .env                  # Frontend environment variables
    └── vite.config.ts        # Vite configuration
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/finance_management

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # Max requests per window

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME="Finance Management System"
VITE_APP_VERSION=1.0.0
VITE_GOOGLE_ANALYTICS_ID=  # Optional
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

### User
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/password` - Change password

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get transaction summary

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Reports
- `GET /api/reports/transactions` - Generate transactions report (PDF/CSV)
- `GET /api/reports/summary` - Get financial summary report

> **Note**: For detailed API documentation, visit `/api-docs` when the backend server is running.

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd fms-frontend
npm run test
```

### Linting
```bash
# Backend
cd backend
npm run lint

# Frontend
cd ../fms-frontend
npm run lint
```

## 🛠 Built With

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.0+
- **UI Components**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Yup validation
- **Data Visualization**: Recharts
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast
- **PDF Generation**: jsPDF
- **HTTP Client**: Axios
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Security**: bcrypt for password hashing
- **Validation**: Express Validator
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Type Checking**: TypeScript
- **Version Control**: Git
- **API Testing**: Postman/Insomnia

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🚀 Deployment

### Frontend
```bash
# Build for production
cd fms-frontend
npm run build

# Preview production build
npm run preview
```

### Backend
```bash
# Set NODE_ENV to production
NODE_ENV=production node server.js

# Using PM2 (recommended for production)
npm install -g pm2
pm2 start server.js --name="fms-backend"
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Material-UI](https://mui.com/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Recharts](https://recharts.org/)
- [date-fns](https://date-fns.org/)
- [react-hot-toast](https://react-hot-toast.com/)
- [jsPDF](https://github.com/parallax/jsPDF)
