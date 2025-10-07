import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage, RegisterPage } from '../pages/auth';
import DashboardPage from '../pages/dashboard/DashboardPage';
import LettersPage from '../pages/letters/LettersPage';
import ProtectedRoute from './ProtectedRoute';
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
import ProfilePage from '../pages/auth/ProfilePage';
import ApplicantLetterDetailPage from '../pages/letters/ApplicantLetterDetailPage';
import RoleBasedRedirect from './RoleBasedRedirect';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Referee Routes */}
      <Route
        path="/letters"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <LettersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/letters/:id/generate"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <GenerateLetter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/letters/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <EditLetterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/letters/:id"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <LetterDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <TemplatesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates/generate-template"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <LetterAnalyzer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates/new"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <TemplateCreate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['referee']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Applicant Routes */}
      <Route
        path="/view-letters"
        element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ApplicantLetters />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applicant/letters/:id"
        element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ApplicantLetterDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/letters/new"
        element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <LetterRequest />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applicant-dashboard"
        element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ApplicantDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<RoleBasedRedirect />} />

      <Route path="/unauthorized" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      } />

      <Route path="*" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default AppRoutes;