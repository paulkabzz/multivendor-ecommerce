import { useAuth } from "@/src/context/auth-context";
import { Navigate, Outlet } from "react-router";
import Loader from "./loader/loader";

interface AdminRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children, redirectPath="/not-admin" }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="w-full bg-white min-h-[100vh] fixed top-0 right-0 z-[100000] flex items-center justify-center">
                <Loader />
            </div>
        )
    }
    
    if (!isLoading && user?.role !== "ADMIN" ) {
        return <Navigate to={redirectPath} replace />
    }

    return children ? <>{children}</>: <Outlet />;
}

export default AdminRoute;