import { useStore } from "@/src/context/store-context";
import { Navigate, Outlet } from "react-router";
import Loader from "./loader/loader";

interface VendorRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
};

const VendorRoute: React.FC<VendorRouteProps> = ({ children, redirectPath=`/create-store/` }) => {
  const { hasStore, isLoading } = useStore();


  if (isLoading) return <div className="w-full bg-white min-h-[100vh] fixed top-0 right-0 z-[100000] flex items-center justify-center"><Loader /></div>;

  if (!isLoading && !hasStore) {
     return <Navigate to={redirectPath} replace/>
  }

  return children ? <>{children}</> : <Outlet />;
}

export default VendorRoute;