import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const handleLogin = async (email: string, password: string) => {

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            console.log(email, password);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
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
