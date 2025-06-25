import { Input } from "@/src/components/common/input/input";
import shoppingBag from "@assets/icons/shopping-bag.png";
import profileIcon from "@assets/icons/profile.png";
import { Hamburger } from "../hamburger/hamburger";
import searchIcon from "@assets/icons/search.png";
import { Link } from "react-router";
import { Button } from "../buttons/button";
import { useAuth } from "@/src/context/auth-context";
import { useStore } from "@/src/context/store-context";
import defaultStore from '@assets/ui/default-store.png'

export const Nav: React.FC = (): React.ReactElement => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { hasStore, store } = useStore();
  
  // Debug logging
  // console.log('Nav render - isAuthenticated:', isAuthenticated, 'user:', user);
  
  const getProfileLink = () => {
    if (isLoading) return "#";
    
    if (isAuthenticated && user?.user_id) {
      return `/profile/${user.user_id}`;
    }
    
    return "/login";
  };

  return (
    <header className="sticky top-0 right-0 bg-[#131313] h-[55px] w-full mt-[50px] px-[200px] py-[.5rem] flex flex-col justify-center z-[150]">
      <div className="flex items-center justify-between text-[#fff]">
        <div className=" flex items-center gap-5 font-[900]">
          <Hamburger /> <Link to={"/"}>Ecom</Link>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Search products, stores, or brands"
            icon={searchIcon}
          />
            {
              !isLoading && isAuthenticated && hasStore ? (
                <Link to={`/my-store/${store?.vendor_id}`} className="text-[12px] font-bold bg-white text-primary-dark rounded-3xl py-1 h-[40px] hover:opacity-90 flex items-center gap-2 px-3">
                  Store
                  <img src={store?.avatar_url ?? defaultStore } alt={store?.store_name} className="w-[25px] h-[25px] rounded-full" />
                </Link>
              ) :
              (
                <Link to={"/create-store"}>
                  <Button
                    text="Create Store"
                    className="bg-white !text-primary-dark !text-[12px] px-6"
                  />
                </Link>
              )
            }
          <Link to="#cart">
            <img src={shoppingBag} alt="Cart" className="w-[20px] h-[20px]" />
          </Link>
          <Link to={getProfileLink()}>
            <img
              src={user?.avatar_url || profileIcon}
              alt="Profile"
              className="w-[25px] h-[25px] rounded-full hover:border-solid hover:border-white"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};