import { Input } from '@components/common/input/input';
import shoppingBag from '@assets/icons/shopping-bag.png';
import profileIcon from '@assets/icons/profile.png';
import { Hamburger } from '../common/hamburger/hamburger';
import searchIcon from '@assets/icons/search.png'
import { Link } from 'react-router';

export const Nav: React.FC = (): React.ReactElement => {
  return (
    <header className="sticky top-0 right-0 bg-[#131313] h-[55px] w-full mt-[50px] px-[200px] py-[.5rem] flex flex-col justify-center">
      <div className="flex items-center justify-between text-[#fff]">
          <div className=" flex items-center gap-5 font-[900]">
              <Hamburger /> <Link to={'/'}>Ecom</Link>
          </div>
          <div className="flex items-center gap-3">
                <Input type="text" placeholder="Search products, stores, or brands" icon={searchIcon} />
                <a href="#cart">
                  <img src={shoppingBag} alt="Cart" className="w-[20px] h-[20px]" />
                </a>
                  <a href="#profile">
                  <img src={profileIcon} alt="Profile" className="w-[20px] h-[20px]" />
                </a>
          </div>
      </div>
    </header>
  );
};
