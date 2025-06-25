import { useAuth } from "@/src/context/auth-context";
import { Navigate, Outlet } from "react-router";

interface AdminRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children, redirectPath="/" }) => {
    const { user, isLoading } = useAuth();

    if (!isLoading && user?.role !== "ADMIN" ) {
        return <Navigate to={redirectPath} replace />
    }

    return children ? <>{children}</>: <Outlet />;
}

export default AdminRoute;