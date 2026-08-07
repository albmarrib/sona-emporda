import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRole: 'musician' | 'venue' | 'admin';
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading || (currentUser && userRole === null)) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-gold font-serif text-2xl animate-pulse">
        Comprobando credenciales...
      </div>
    );
  }

  // Si no está logueado o el rol no coincide (y no es admin), echarlo fuera
  if (!currentUser || (userRole !== allowedRole && userRole !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
