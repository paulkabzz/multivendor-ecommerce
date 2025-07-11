import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../common/buttons/button";
import { Input } from "../common/input/input";
import defaultProfilePic from "@assets/ui/default.png";
import { ProfileSideBar } from "./profile-sidebar";
import { Camera, CreditCard, MapPin, ShoppingBag, X, Upload, Loader2 } from "lucide-react";
import FileUploader from "../common/file-uploader/file-uploader";
import { useAuth } from "@/src/context/auth-context";
import Loader from "../common/loader/loader";
import OTPModal from "../modals/opt-modal"; // Import the OTP modal

const ProfileContent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    updateUser,
    updateAvatar,
    verifyOTP,
    resendOTP,
    logout,
    isUpdateLoading,
    isAvatarLoading,
    isOTPLoading,
    updateError,
    avatarError,
    otpError,
    refetchUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [profileImage, setProfileImage] = useState<File[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  
  // OTP Modal state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingEmailUpdate, setPendingEmailUpdate] = useState<string | null>(null);
  const [updateResponse, setUpdateResponse] = useState<any>(null);

  // Memoize the original data to prevent unnecessary re-calculations
  const originalData = useMemo(() => {
    if (!user) return null;
    return {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
    };
  }, [user?.first_name, user?.last_name, user?.email, user?.phone]);

  // Update form data when user data changes (only when originalData changes)
  useEffect(() => {
    if (originalData) {
      setFormData(originalData);
    }
  }, [originalData]);

  // Check for changes whenever formData updates
  useEffect(() => {
    if (!originalData) {
      setHasChanges(false);
      return;
    }

    const keys = Object.keys(formData) as Array<keyof typeof formData>;
    const isChanged = keys.some(
      (key) =>
        String(formData[key]).toLowerCase().trim() !==
        String(originalData[key]).toLowerCase().trim(),
    );

    setHasChanges(isChanged);
  }, [formData, originalData]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (saveSuccess) {
      setSaveSuccess(false);
    }
  }, [saveSuccess]);

  const getChangedFields = useCallback(() => {
    if (!user || !originalData) return {};

    const changedFields: any = {
      user_id: user.user_id,
    };

    Object.keys(formData).forEach((key) => {
      const formValue = String(formData[key as keyof typeof formData]).trim();
      const originalValue = String(
        originalData[key as keyof typeof originalData],
      ).trim();

      if (formValue !== originalValue) {
        changedFields[key] = formValue;
      }
    });

    return changedFields;
  }, [user, originalData, formData]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || !user) return;

    try {
      const changedFields = getChangedFields();
      console.log("Sending only changed fields:", changedFields);

      const response = await updateUser(changedFields);
      
      // Check if email verification is required
      if (response.requiresVerification && response.emailSent) {
        // Email change requires verification
        setPendingEmailUpdate(changedFields.email);
        setUpdateResponse(response);
        setShowOTPModal(true);
        
        // Show info message about email verification
        setSaveSuccess(false);
        // Don't mark as success yet since email isn't verified
      } else {
        // Regular update without email change or email verification not required
        setSaveSuccess(true);
        setHasChanges(false);
        
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      // Reset form to original values if update failed
      if (originalData) {
        setFormData(originalData);
      }
    }
  }, [hasChanges, user, getChangedFields, updateUser, originalData]);

  const handleOTPVerify = useCallback(async (otp: string): Promise<boolean> => {
    try {
      const response = await verifyOTP(otp);

      
      if (response) {
        // OTP verified successfully
        setShowOTPModal(false);
        setPendingEmailUpdate(null);
        setUpdateResponse(null);
        
        // Refresh user data to get the updated email
        await refetchUser();
        
        // Show success message
        setSaveSuccess(true);
        setHasChanges(false);
        
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      return false;
    }
  }, [verifyOTP, refetchUser]);

  const handleOTPResend = useCallback(async (): Promise<boolean> => {
    try {
      const response = await resendOTP();
      return response;
    } catch (error: any) {
      console.error("Failed to resend OTP:", error);
      return false;
    }
  }, [resendOTP]);

  const handleOTPModalClose = useCallback(() => {
    setShowOTPModal(false);
    setPendingEmailUpdate(null);
    setUpdateResponse(null);
    
    // Reset form to original values since email verification was cancelled
    if (originalData) {
      setFormData(originalData);
      setHasChanges(false);
    }
  }, [originalData]);

  const handleCloseModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowUploader(false);
      setIsClosing(false);
      setProfileImage([]);
    }, 200);
  }, []);

  const handleProfileImageChange = useCallback((files: File[]) => {
    setProfileImage(files);
    console.log("Profile image selected:", files);
  }, []);

  const handleSaveProfileImage = useCallback(async () => {
    if (profileImage.length === 0 || !user?.user_id) {
      console.error("No image selected or user ID missing");
      return;
    }

    try {
      const file = profileImage[0];
      console.log("Uploading profile image for user:", user.user_id);

      await updateAvatar({
        userId: user.user_id,
        avatarFile: file
      });

      // Success! Close the modal and show success message
      handleCloseModal();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      // Error is already handled by the mutation
    }
  }, [profileImage, user?.user_id, updateAvatar, handleCloseModal]);

  // Handle loading states
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load profile data.</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            Retry
          </button>
          <button 
            onClick={logout} 
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No user data available.</p>
        </div>
      </div>
    );
  }

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
      {updateError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{updateError}</p>
        </div>
      )}

      {/* Success Display */}
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">
            Profile updated successfully!
          </p>
        </div>
      )}

      {/* Email Verification Pending Display */}
      {pendingEmailUpdate && showOTPModal && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-600 text-sm">
            Please verify your new email address ({pendingEmailUpdate}) to complete the update.
          </p>
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden">
            <div className="w-full h-full rounded-full overflow-hidden">
              <img
                src={user?.avatar_url || defaultProfilePic}
                alt={`${user?.first_name}'s profile`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <button
            onClick={() => setShowUploader(true)}
            className="absolute bottom-1 right-1 w-7 h-7 bg-primary-dark text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110 transform hover:from-blue-700 hover:to-blue-800"
            disabled={isAvatarLoading}
          >
            {isAvatarLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
          </button>
        </div>
        <div className="text-center mt-6">
          <h3 className="text-xl font-bold text-gray-900">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-gray-500 text-sm">{user.email}</p>
          {!user.is_verified && (
            <p className="text-orange-600 text-xs mt-1">
              Email not verified
            </p>
          )}
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
            action={(e: any) => handleInputChange("first_name", e.target.value)}
            className="w-full"
            disabled={isUpdateLoading}
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
            action={(e: any) => handleInputChange("last_name", e.target.value)}
            className="w-full"
            disabled={isUpdateLoading}
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
            action={(e: any) => handleInputChange("email", e.target.value)}
            className="w-full"
            disabled={isUpdateLoading}
          />
          {formData.email !== originalData?.email && (
            <p className="text-sm text-blue-600 mt-1">
              Changing your email will require verification
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number
          </label>
          <Input
            type="tel"
            value={formData.phone}
            placeholder="Enter your phone number"
            action={(e: any) => handleInputChange("phone", e.target.value)}
            className="w-full"
            disabled={isUpdateLoading}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          text={isUpdateLoading ? "Saving..." : "Save Changes"}
          action={handleSave}
          className={`
            px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2
            ${
              hasChanges && !isUpdateLoading
                ? "bg-[rgb(46,152,111)] text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-200 !text-gray-400 cursor-not-allowed"
            }
          `}
          disabled={!hasChanges || isUpdateLoading}
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
        <p className="text-sm text-gray-500 mt-2">
          Your order history will appear here
        </p>
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
    <div className="flex">
      <ProfileSideBar active={activeTab} setActive={setActiveTab} user={user} />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">{renderContent()}</div>
      </div>

      {/* File Uploader Modal */}
      {showUploader && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${isClosing ? "opacity-0" : "opacity-100"}`}>
          {/* Backdrop */}
          <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-50"}`} onClick={!isAvatarLoading ? handleCloseModal : undefined}/>

          {/* Modal */}
          <div className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-all duration-300 ease-out ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
            {/* Header */}
            <div className="bg-primary-dark px-6 py-4 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      Update Profile Picture
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Choose a new image for your profile
                    </p>
                  </div>
                </div>
                <button onClick={handleCloseModal} disabled={isAvatarLoading} className="w-8 h-8 bg-white bg-opacity-20 cursor-pointer rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Upload Error */}
              {avatarError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{avatarError}</p>
                </div>
              )}

              <div className="h-96">
                <FileUploader fieldChange={handleProfileImageChange} mediaUrl={user?.avatar_url || ""}/>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p>Supported formats: PNG, JPG, JPEG, WEBP, SVG</p>
                <p className="text-xs">Maximum file size: 5MB</p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  text="Cancel"
                  action={handleCloseModal}
                  disabled={isAvatarLoading}
                  className="px-4 py-2 !bg-gray-200 !text-gray-700 hover:!bg-gray-300 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                />
                <Button
                  text={isAvatarLoading ? "Uploading..." : profileImage.length > 0 ? "Save Image" : "Choose Image"}
                  action={handleSaveProfileImage}
                  disabled={profileImage.length === 0 || isAvatarLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${ profileImage.length > 0 && !isAvatarLoading ? " !text-white !bg-[rgb(46,152,111)] shadow-lg hover:shadow-xl transform hover:scale-[1.01]" : "!bg-gray-300 !text-gray-500 cursor-not-allowed" }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOTPModal && pendingEmailUpdate && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={handleOTPModalClose}
          onVerify={handleOTPVerify}
          onResendOTP={handleOTPResend}
          email={pendingEmailUpdate}
          isLoading={isOTPLoading}
          error={otpError}
        />
      )}
    </div>
  );
};

export default ProfileContent;