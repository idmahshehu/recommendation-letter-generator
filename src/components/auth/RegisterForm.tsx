import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface RegisterFormProps {
    onRegister?: (firstName: string, lastName: string, email: string, password: string, role: string) => Promise<void>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister }) => {
    const [firstName, setfirstName] = useState('');
    const [lastName, setlastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [availableRoles, setavailableRoles] = useState(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/auth/roles');
                const roles = await response.json();
                setavailableRoles(roles.map((r: string) => r.toLowerCase()));
            } catch (error) {
                console.error('Failed to fetch roles:', error);
                setavailableRoles(['applicant']); // fallback
            }
        };

        fetchRoles();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (onRegister) {
                await onRegister(firstName, lastName, email, password, role);
            } else {
                // Fallback if onRegister is not provided
                console.log('Register attempt:', { firstName, lastName, email, password, role });

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (err: any) {
            setError(err.message || 'Register failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            bgcolor="background.default"
        >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Register
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="First Name"
                        type="firstName"
                        value={firstName}
                        onChange={(e) => setfirstName(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        label="Last Name"
                        type="lastName"
                        value={lastName}
                        onChange={(e) => setlastName(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        select
                        label="Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                    >
                        {availableRoles.map((roleOption) => (
                            <MenuItem key={roleOption} value={roleOption}>
                                {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                            </MenuItem>
                        ))}
                    </TextField>
                    {/* <TextField
                        fullWidth
                        select
                        label="Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                    >
                        {availableRoles
                            .filter((r) => r)
                            .map((roleOption) => (
                                <MenuItem key={roleOption} value={roleOption}>
                                    {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                                </MenuItem>
                            ))}
                    </TextField> */}

                    {/* <TextField
                        fullWidth
                        label="Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading} /> */}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Register'}
                    </Button>
                </form>
                <Typography variant="body2" align="center">
                    Already have an account?{' '}
                    <Button color="primary" onClick={() => navigate('/login')}>
                        Login
                    </Button>
                </Typography>
            </Paper>
        </Box>
    );
};

export default RegisterForm;