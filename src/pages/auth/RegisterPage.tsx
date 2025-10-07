import React from 'react'
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import { api } from '../../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const handleRegister = async (firstName: string, lastName: string, email: string, password: string, role: string) => {

    try {
      const response = await api.post('/auth/register', { firstName, lastName, email, password, role });
      console.log(firstName, lastName, email, password, role);

      const data = response.data;

      // if (!response) {
      //   throw new Error(data.message || 'Register failed');
      // }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  return <RegisterForm onRegister={handleRegister} />;
};

export default RegisterPage