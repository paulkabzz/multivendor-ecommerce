import { useAppSelector } from '@/src/store/hooks';
import { useNavigate } from 'react-router';
import { Button } from '@/src/components/common/buttons/button';
import defaultProfilePic from '@assets/ui/default.png';
import { useAppDispatch } from '@/src/store/hooks';
import { logout } from '@/src/store/slices/userSlice';

const Profile: React.FC = (): React.ReactElement => {
  const { user } = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <section className="w-full flex flex-col items-center pt-10 min-h-[75vh]">
      <h1 className="font-[700] text-[2.5rem] mb-8">My Profile</h1>
      
      <div className='flex flex-col items-center'>
            <div className="w-[250px] h-[250px] rounded-full bg-red relative">
                <img src={user?.profile_pic_url ?? defaultProfilePic} alt={`${user?.first_name}'s profile pic.`} className='w-full h-full object-cover' />
                <Button text='+' className='w-[30px] h-[30px] bg-[rgb(46,152,111)] text-primary-light rounded-full flex items-center justify-center absolute bottom-[10%] right-[10%] border-[#fff] border-[.15rem] border-solid cursor-pointer' />
            </div>
      </div>
     
    </section>
  );
};

export default Profile;