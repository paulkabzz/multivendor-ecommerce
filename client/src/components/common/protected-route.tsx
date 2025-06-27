import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/src/context/auth-context";
import Loader from "./loader/loader";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = `/login?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`,
  children,
}) => {
  const { isAuthenticated, isLoading } =  useAuth();

  if (isLoading) return <div className="w-full h-[70vh] flex items-center justify-center"><Loader /></div>

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
