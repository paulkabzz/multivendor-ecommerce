import { logout } from "@/src/store/slices/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

export const ProfileSideBar: React.FC = (): React.ReactElement => {

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
            text: "Log Out",
            icon: ""
        }
    ];

    const handleLogout = ():void => {
        dispatch(logout());
        navigate('/');
    };
    
  return (
    <div className="">
        {
            links.map((i: {text: string, icon: string}, j: number) => (
                    <div key={j}>
                        {i.text}
                    </div>
            ))
            
        }
    </div>
  )
};