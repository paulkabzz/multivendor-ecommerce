import { useEffect, useState } from "react";
import { Button } from "../common/buttons/button";
import { Input } from "../common/input/input";
import defaultProfilePic from '@assets/ui/default.png';
import { ProfileSideBar } from "./profile-sidebar";

interface IProfileContentProps {
    user: any
};

const ProfileContent: React.FC<IProfileContentProps> = ({ user }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes whenever formData updates
  useEffect(() => {
    const originalData = {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    };

    // Compare current form data with original data (case-insensitive)
    const keys = Object.keys(formData) as Array<keyof typeof formData>;
    const isChanged = keys.some(key => 
      String(formData[key]).toLowerCase().trim() !== String(originalData[key]).toLowerCase().trim()
    );

    setHasChanges(isChanged);
  }, [formData, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return (
      <div className='flex flex-col items-center w-full min-h-[80vh]'>
        <div className="w-[250px] h-[250px] rounded-full bg-red relative">
          <img 
            src={user?.profile_pic_url ?? defaultProfilePic} 
            alt={`${user?.first_name}'s profile pic.`} 
            className='w-full h-full object-cover rounded-full' 
          />
          <Button 
            text='+' 
            className='!w-[30px] !h-[30px] bg-[rgb(46,152,111)] text-primary-light rounded-full flex items-center justify-center absolute bottom-[10%] right-[10%] border-[#fff] border-[.15rem] border-solid cursor-pointer' 
          />
        </div>
        
        <div className="mt-10 w-full max-w-md space-y-4">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <Input 
                type='text' 
                value={formData.first_name} 
                placeholder="First Name"
                action={(e: any) => handleInputChange('first_name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input 
                type='text' 
                value={formData.last_name} 
                placeholder="Last Name"
                action={(e: any) => handleInputChange('last_name', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input 
              type='email' 
              value={formData.email} 
              placeholder="Email Address"
              action={(e: any) => handleInputChange('email', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <Input 
              type='tel' 
              value={formData.phone} 
              placeholder="Phone Number"
              action={(e: any) => handleInputChange('phone', e.target.value)}
            />
          </div>
          
          <div className="pt-4">
            <Button 
              text="Update Profile" 
              className={`w-full !text-[12px] rounded-full py-2 px-4 transition-colors ${
                hasChanges 
                  ? 'bg-[rgb(46,152,111)] text-white hover:bg-[rgb(36,142,101)] cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!hasChanges}
            />
          </div>
        </div>
      </div>
  )
}

export default ProfileContent;