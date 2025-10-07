import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const handleLogin = async (email: string, password: string) => {

        try {
            const response = await api.post('/auth/login', { email, password });

            const data = response.data;

            // if (!response) {
            //     throw new Error(data.message || 'Login failed');
            // }
            console.log(data);

            login(data.user, data.token);

            // Navigate based on user role
            if (data.user.role === 'applicant') {
                navigate('/applicant-dashboard');
            } else if (data.user.role === 'referee') {
                navigate('/dashboard');
            } else {
                navigate('/'); // fallback
            }
        } catch (error) {
            throw error;
        }
    };

    return <LoginForm onLogin={handleLogin} />;
};

export default LoginPage;
