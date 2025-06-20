import { logout } from "@/src/store/slices/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { User, ShoppingBag, CreditCard, MapPin, LogOut, ChevronRight } from "lucide-react";
import defaultProfilePic from "@assets/ui/default.png";

interface IProfileSideBar {
  active: number;
  setActive: (index: number) => void;
  user?: any;
}

export const ProfileSideBar: React.FC<IProfileSideBar> = ({
  active,
  setActive,
  user,
}): React.ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const links: { text: string; icon: React.ReactNode; action?: () => void }[] =
    [
      {
        text: "Profile",
        icon: <User size={20} />,
      },
      {
        text: "Orders",
        icon: <ShoppingBag size={20} />,
      },
      {
        text: "Payment Methods",
        icon: <CreditCard size={20} />,
      },
      {
        text: "Address",
        icon: <MapPin size={20} />,
      },
      {
        text: "Logout",
        icon: <LogOut size={20} />,
        action: handleLogout,
      },
    ];

  function handleLogout(): void {
    dispatch(logout());
    navigate("/");
  }

  const handleItemClick = (index: number, item: (typeof links)[0]): void => {
    if (item.action) {
      item.action();
    } else {
      setActive(index + 1);
    }
  };

  return (
    <div className="flex flex-col justify-center h-full w-[320px] border-r border-gray-500 border-r-solid ">
      {/* User Info Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden">
            {user?.profile_pic_url ? (
              <img
                src={user.profile_pic_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={defaultProfilePic} alt="Profile" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[1rem] font-semibold text-gray-900 truncate">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email?.split("@")[0] || "User"}
            </h3>
            <p className="text-[12px] text-gray-500 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4">
        <div className="space-y-1 px-3">
          {links.map((item, index) => {
            const isActive = active === index + 1;
            const isLogout = item.text === "Logout";

            return (
              <button
                key={index}
                onClick={() => handleItemClick(index, item)}
                className={`w-full !flex !items-center !justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 group ${isActive && !isLogout ? "bg-gray-100 text-gray-600 border border-gray-200 shadow-sm" : isLogout ? "text-red-600 hover:bg-red-50 hover:text-red-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <div className="!flex justify-center space-x-3">
                  <div className={`transition-colors duration-200 ${ isActive && !isLogout ? "text-gray-600" : isLogout ? "text-red-500" : "text-gray-500 group-hover:text-gray-700" }`}>
                    {item.icon}
                  </div>
                  <span className={`font-medium text-sm ${isActive && !isLogout ? "text-gray-600" : ""}`}>
                    {item.text}
                  </span>
                </div>

                {!isLogout && (
                  <ChevronRight size={16} className={`transition-all duration-200 ${isActive ? "text-gray-600 translate-x-1" : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5"}`}/>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
