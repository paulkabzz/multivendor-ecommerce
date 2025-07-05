import { useDepartments } from "@/src/context/ui-context";
import { CategoryButton } from "../buttons/category-button";
import Loader from "../loader/loader";
import { useLocation } from "react-router-dom";

export const Header: React.FC = (): React.ReactElement => {
  const { 
      data: departments = [], 
      isLoading: departmentsLoading,
    } = useDepartments();

    const location = useLocation();
    const department_id: string | null = new URLSearchParams(location.search).get('departmentId');
    const currentPath = location.pathname;
    
    // Check if we're on the home page
    const isHomePage = currentPath === '/';
    
    // Check if we're on a department page
    const isDepartmentPage = currentPath.includes('/department');

    if (departmentsLoading) {
      return (
            <div className="w-full bg-white min-h-[100vh] fixed top-0 right-0 z-[100000] flex items-center justify-center">
                <Loader />
            </div>
      )
    }

  return (
    <>
      <header className="absolute top-0 right-0 w-full h-[50px] bg-[#fff] flex justify-between items-center px-[200px] overflow-y-auto z-[100] ">
        {[{ department_name: "All", department_id: null }, ...departments.slice(0, 9)].map((department: any, key: number) => {
          let isActive = false;
          
          // "All" button is active only on home page
          if (department.department_id === null) {
            isActive = isHomePage;
          } else {
            // Department button is active only on department pages with matching ID
            isActive = isDepartmentPage && department_id === department.department_id;
          }
          
          return (
            <CategoryButton
              key={key}
              text={department.department_name}
              href={department.department_id ? `/department?departmentId=${department.department_id}` : '/'}
              className={
                `font-[600] text-[12px] py-2 px-4 rounded-[100px] hover:text-[#fff] hover:bg-primary-dark ` +
                (isActive ? "text-[#fff] bg-primary-dark" : "bg-transparent text-primary-dark")
              }
            />
          );
        })}
      </header>
    </>
  );
};