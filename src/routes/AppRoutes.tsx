import React from 'react'
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage, RegisterPage } from '../pages/auth';
import { DashboardPage } from '../pages/dashboard';
import { LettersPage } from '../pages/letters';
import ProtectedRoute from './ProtectedRoute';
import LetterForm from '../components/letters/LetterForm';
import GenerateLetter from '../pages/letters/GenerateLetter';
import EditLetterPage from '../pages/letters/EditLetterPage';
import PublicRoute from './PublicRoute';

function AppRoutes() {
  return (
    // <Routes>
    //   <Route path="/login" element={<LoginPage />} />
    //   <Route path="/register" element={<RegisterPage />} />
    //   <Route
    //     path="/dashboard"
    //     element={
    //       <ProtectedRoute>
    //         <DashboardPage />
    //       </ProtectedRoute>
    //     }
    //   />
    //   <Route path="/letters" element={<LettersPage />} />
    //   <Route path="/letters/:id/generate" element={<GenerateLetter />} />
    //   <Route path="/letters/:id/edit" element={<EditLetterPage />} />
    // </Routes>

    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      <Route path="/letters" element={
        <ProtectedRoute>
          <LettersPage />
        </ProtectedRoute>
      } />
      
      <Route path="/letters/:id/generate" element={
        <ProtectedRoute>
          <GenerateLetter />
        </ProtectedRoute>
      } />
      
      {/* <Route path="/letters/:id" element={
        <ProtectedRoute>
          <LetterDetailPage />
        </ProtectedRoute>
      } /> */}
      
      <Route path="/letters/:id/edit" element={
        <ProtectedRoute>
          <EditLetterPage />
        </ProtectedRoute>
      } />
      
      {/* <Route path="/templates" element={
        <ProtectedRoute>
          <TemplatesPage />
        </ProtectedRoute>
      } /> */}
      
      {/* <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } /> */}
      
      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes