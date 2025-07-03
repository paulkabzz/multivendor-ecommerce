import { useDepartments } from "@/src/context/ui-context";
import { CategoryButton } from "../buttons/category-button";
import Loader from "../loader/loader";

export const Header: React.FC = (): React.ReactElement => {
  const { 
      data: departments = [], 
      isLoading: departmentsLoading,
    } = useDepartments();

    const department_id: string | null = new URLSearchParams(window.location.search).get('departmentId');

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
        {[{ department_name: "All", department_id: null }, ...departments.slice(0, 9)].map((department: any, key: number) => (
          <CategoryButton
            key={key}
            text={department.department_name}
            href={department.department_id ? `/department?departmentId=${department.department_id}` : '/'}
            className={
              `font-[600] text-[12px] py-2 px-4 rounded-[100px] hover:text-[#fff] hover:bg-primary-dark ` +
              (department_id === department.department_id ? "text-[#fff] bg-primary-dark" : "text-primary-dbg-primary-dark")
            }
          />
        ))}
      </header>
    </>
  );
};
