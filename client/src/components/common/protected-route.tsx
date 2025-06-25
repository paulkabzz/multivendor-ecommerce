import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/src/context/auth-context";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = `/login?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`,
  children,
}) => {
  const { isAuthenticated, isLoading } =  useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
