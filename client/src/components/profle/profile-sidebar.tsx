import { logout } from "@/src/store/slices/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

interface IProfileSideBar {
    active: number;
    setActive: (e: (any | void)) => any | void;
}

export const ProfileSideBar: React.FC<IProfileSideBar> = ({ active, setActive }): React.ReactElement => {

    const dispatch = useDispatch();
    const navigate = useNavigate();



    const links: {text: string, icon: string}[] = [
        {
            text: "Profile",
            icon: ""
        },
        {
            text: "Orders",
            icon: ""
        },
        {
            text: "Payment Methods",
            icon: ""
        },
        {
            text: "Address",
            icon: ""
        },
        {
            text: "Logout",
            icon: ""
        }
    ];

    const handleLogout = ():void => {
        dispatch(logout());
        navigate('/');
    };
    
  return (
    <div className="flex flex-col justify-center px-10 h-full w-[300px] gap-3 bg-primary-light top-0 left-0 z-[-10]">
        {
            links.map((i: {text: string, icon: string}, j: number) => (
                    <div key={j} className="text-primary-dark text-[14px] font-bold" onClick={() => setActive(j+1) || i.text === "Logout" ? handleLogout() : null}>
                        {i.text}
                    </div>
            ))
            
        }
    </div>
  )
};