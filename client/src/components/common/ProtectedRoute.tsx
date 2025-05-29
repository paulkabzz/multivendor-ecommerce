import { Navigate, Outlet } from 'react-router';
import { useAppSelector } from '@/src/store/hooks';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  redirectPath = '/login',
  children 
}) => {
  const { isAuthenticated, user } = useAppSelector(state => state.user);
  
  // Check if user is authenticated and verified
  if (!isAuthenticated || !user?.is_verified) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;