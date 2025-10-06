import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      if (user?.role === 'applicant') {
      return <Navigate to="/applicant-dashboard" replace />;
    } else if (user?.role === 'referee') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
