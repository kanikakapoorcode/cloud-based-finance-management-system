# Finance Management System (FMS)

A full-stack cloud-based finance management system that helps users track their income, expenses, and financial goals with an intuitive interface and powerful analytics.

![Finance Management System](https://via.placeholder.com/800x400?text=Finance+Management+System+Screenshot)

## ✨ Features

### Backend (Node.js + Express)
- **User Authentication**
  - JWT-based authentication
  - Secure password hashing with bcrypt
  - Role-based access control

- **Financial Management**
  - Income and expense tracking
  - Category management
  - Transaction history with filtering
  - Financial reports and analytics

- **API Features**
  - RESTful API design
  - Request validation
  - Rate limiting and security headers
  - Error handling and logging
  - API documentation with Swagger

### Frontend (React + Vite)
- **User Interface**
  - Responsive design with Material-UI
  - Interactive dashboards
  - Data visualization with Recharts
  - Form validation with Formik and Yup

- **User Experience**
  - Intuitive navigation
  - Real-time updates
  - Toast notifications
  - Dark/light theme support

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher) or Yarn
- MongoDB (v6.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/finance-management-system.git
   cd finance-management-system
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
├── backend/               # Backend server (Node.js/Express)
│   ├── config/           # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── .env               # Environment variables
│   └── server.js          # Entry point
│
└── fms-frontend/         # Frontend application (React/Vite)
    ├── public/           # Static files
    ├── src/
    │   ├── assets/       # Images, fonts, etc.
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   ├── store/         # State management
    │   ├── utils/         # Helper functions
    │   └── App.jsx        # Main application component
    └── vite.config.js     # Vite configuration
```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 📚 API Documentation

API documentation is available at `/api-docs` when the backend server is running. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
npm test
```

## 🛠 Built With

- **Frontend**: React, Vite, Material-UI, Redux Toolkit, Recharts
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT
- **Development Tools**: ESLint, Prettier, Husky

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- [Create React App](https://create-react-app.dev/)
- [Material-UI](https://mui.com/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
