import { Routes, Route } from 'react-router-dom';
import Login from '../components/Auth/Login'; // No curly braces
import Signup from '../components/Auth/Signup';

function AuthPage() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default AuthPage;