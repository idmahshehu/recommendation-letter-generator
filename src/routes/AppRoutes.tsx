import React from 'react'
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginPage, RegisterPage } from '../pages/auth';
import { DashboardPage } from '../pages/dashboard';
import { LettersPage } from '../pages/letters';
import ProtectedRoute from './ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/letters" element={<LettersPage />} />
    </Routes>
  );
}

export default AppRoutes