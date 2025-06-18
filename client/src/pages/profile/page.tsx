import { useAppSelector } from '@/src/store/hooks';
import ProfileContent from '@/src/components/profle/profile-content';

const Profile: React.FC = (): React.ReactElement => {
  const { user } = useAppSelector(state => state.user);


  return (
    <section className="w-full flex flex-col items-center pt-10">
      <div className='w-full flex justify-between'>
          <div className='w-full'>
              <ProfileContent user={user}/>
          </div>
      </div>
    </section>
  );
};

export default Profile;