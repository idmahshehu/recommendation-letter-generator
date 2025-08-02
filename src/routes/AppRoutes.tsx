import React from 'react'
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginPage, RegisterPage } from '../pages/auth';
import { DashboardPage } from '../pages/dashboard';
import { LettersPage } from '../pages/letters';
import ProtectedRoute from './ProtectedRoute';
import LetterForm from '../components/letters/LetterForm';
import GenerateLetter from '../pages/letters/GenerateLetter';
import EditLetterPage from '../pages/letters/EditLetterPage';

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
      <Route path="/letters/:id/generate" element={<GenerateLetter />} />
      <Route path="/letters/:id/edit" element={<EditLetterPage />} />
    </Routes>
  );
}

export default AppRoutes