import { useAppSelector } from '@/src/store/hooks';
import { useNavigate } from 'react-router';
import { Button } from '@/src/components/common/buttons/button';
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
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">User Information</h2>
          <div className="space-y-3">
            <p><span className="font-medium">Name:</span> {user?.first_name} {user?.last_name}</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Role:</span> {user?.role}</p>
            <p><span className="font-medium">Verification Status:</span> {user?.is_verified ? 'Verified' : 'Not Verified'}</p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <Button 
            text="Logout" 
            className="!text-[12px] w-full bg-red-500 hover:bg-red-600" 
            action={handleLogout}
          />
        </div>
      </div>
    </section>
  );
};

export default Profile;