import React from 'react'
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage, RegisterPage } from '../pages/auth';
import DashboardPage from '../pages/dashboard/DashboardPage';
import LettersPage from '../pages/letters/LettersPage';
import ProtectedRoute from './ProtectedRoute';
// import LetterForm from '../components/letters/LetterForm';
import GenerateLetter from '../pages/letters/GenerateLetter';
import EditLetterPage from '../pages/letters/EditLetterPage';
import PublicRoute from './PublicRoute';
import TemplatesPage from '../pages/templates/TemplatesPage';
import ApplicantDashboard from '../pages/dashboard/ApplicantDashboard';
import TemplateCreate from '../pages/templates/TemplateCreate';
import LetterRequest from '../pages/letters/LetterRequest';
import LetterDetailPage from '../pages/letters/LetterDetailPage';
import LetterAnalyzer from '../pages/templates/LetterAnalyzer';
import ApplicantLetters from '../pages/letters/ApplicantLetters';

function AppRoutes() {
  return (
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
      {/* <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } /> */}

      <Route path="/letters" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <LettersPage />
        </ProtectedRoute>
      } />

      <Route path="/view-letters" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <ApplicantLetters />
        </ProtectedRoute>
      } />

      <Route path="/letters/:id/generate" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <GenerateLetter />
        </ProtectedRoute>
      } />

      <Route path="/letters/:id" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <LetterDetailPage />
        </ProtectedRoute>
      } />

      <Route path="/letters/:id/edit" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <EditLetterPage />
        </ProtectedRoute>
      } />

      <Route path="/templates" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <TemplatesPage />
        </ProtectedRoute>
      } />
      <Route path="/templates/generate-template" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <LetterAnalyzer />
        </ProtectedRoute>
      } />

      <Route path="/templates/new" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <TemplateCreate />
        </ProtectedRoute>
      } />

      <Route path="/letters/new" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <LetterRequest />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <DashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/applicant-dashboard" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <ApplicantDashboard />
        </ProtectedRoute>
      } />

      {/* <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } /> */}

      {/* Default redirects */}
      {/* <Route path="/" element={
        <ProtectedRoute allowedRoles={['referee']}>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>} /> */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes