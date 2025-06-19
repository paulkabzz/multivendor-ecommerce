import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../common/buttons/button";
import { Input } from "../common/input/input";
import defaultProfilePic from '@assets/ui/default.png';
import { ProfileSideBar } from "./profile-sidebar";
import { Camera, CreditCard, MapPin, ShoppingBag } from "lucide-react";
import { updateUser } from "@/src/store/slices/userSlice"; 
import type { AppDispatch, RootState } from "@/src/store/index"; 

interface IProfileContentProps {
    user: any;
}

const ProfileContent: React.FC<IProfileContentProps> = ({ user }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.user);
    
    const [activeTab, setActiveTab] = useState(1);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Update form data when user prop changes
    useEffect(() => {
        setFormData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone: user?.phone || ''
        });
    }, [user]);

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

        if (saveSuccess) {
            setSaveSuccess(false);
        }
    };

    const getChangedFields = () => {
        const originalData = {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone: user?.phone || ''
        };

        const changedFields: any = {
            user_id: user?.user_id
        };

        Object.keys(formData).forEach(key => {
            const formValue = String(formData[key as keyof typeof formData]).trim();
            const originalValue = String(originalData[key as keyof typeof originalData]).trim();
            
            if (formValue !== originalValue) {
                changedFields[key] = formValue;
            }
        });

        return changedFields;
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        try {
            const changedFields = getChangedFields();
            
            // Only send changed fields to reduce th api payload
            console.log('Sending only changed fields:', changedFields);
            
            const resultAction = await dispatch(updateUser(changedFields));
            
            if (updateUser.fulfilled.match(resultAction)) {
                setSaveSuccess(true);
                setHasChanges(false);
                
                setTimeout(() => {
                    setSaveSuccess(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 1:
                return renderProfileForm();
            case 2:
                return renderOrdersContent();
            case 3:
                return renderPaymentMethodsContent();
            case 4:
                return renderAddressContent();
            default:
                return renderProfileForm();
        }
    };

    const renderProfileForm = () => (
        <div className="mt-5">
            {/* Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Success Display */}
            {saveSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">Profile updated successfully!</p>
                </div>
            )}

            {/* Profile Picture Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            <img 
                                src={user?.profile_pic_url ?? defaultProfilePic} 
                                alt={`${user?.first_name}'s profile`} 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    </div>
                    <button className="absolute bottom-2 right-2 w-7 h-7 bg-primary-dark text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 group-hover:scale-110 transform">
                        <Camera size={16} />
                    </button>
                </div>
                <div className="text-center mt-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {user?.first_name} {user?.last_name}
                    </h3>
                    <p className="text-gray-500 text-[12px]">{user?.email}</p>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name
                    </label>
                    <Input 
                        type="text" 
                        value={formData.first_name} 
                        placeholder="Enter your first name"
                        action={(e: any) => handleInputChange('first_name', e.target.value)}
                        className="w-full"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                    </label>
                    <Input 
                        type="text" 
                        value={formData.last_name} 
                        placeholder="Enter your last name"
                        action={(e: any) => handleInputChange('last_name', e.target.value)}
                        className="w-full"
                        disabled={loading}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                    </label>
                    <Input 
                        type="email" 
                        value={formData.email} 
                        placeholder="Enter your email"
                        action={(e: any) => handleInputChange('email', e.target.value)}
                        className="w-full"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                    </label>
                    <Input 
                        type="tel" 
                        value={formData.phone} 
                        placeholder="Enter your phone number"
                        action={(e: any) => handleInputChange('phone', e.target.value)}
                        className="w-full"
                        disabled={loading}
                    />
                </div>
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button 
                    text={loading ? 'Saving...' : 'Save Changes'}
                    action={handleSave}
                    className={`
                        px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2
                        ${hasChanges && !loading
                            ? 'bg-[rgb(46,152,111)] text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                            : 'bg-gray-200 !text-gray-400 cursor-not-allowed'
                        }
                    `}
                    disabled={!hasChanges || loading}
                />
            </div>
        </div>
    );

    const renderOrdersContent = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <ShoppingBag size={48} className="mx-auto" />
                </div>
                <p className="text-gray-600">No orders found</p>
                <p className="text-sm text-gray-500 mt-2">Your order history will appear here</p>
            </div>
        </div>
    );

    const renderPaymentMethodsContent = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h2>
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <CreditCard size={48} className="mx-auto" />
                </div>
                <p className="text-gray-600">No payment methods added</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add Payment Method
                </button>
            </div>
        </div>
    );

    const renderAddressContent = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Addresses</h2>
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <MapPin size={48} className="mx-auto" />
                </div>
                <p className="text-gray-600">No addresses saved</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add Address
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex ">
            <ProfileSideBar 
                active={activeTab} 
                setActive={setActiveTab} 
                user={user}
            />
            <div className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProfileContent;