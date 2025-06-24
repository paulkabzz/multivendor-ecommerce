import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../common/buttons/button";
import { Input } from "../common/input/input";
import defaultProfilePic from "@assets/ui/default.png";
import { ProfileSideBar } from "./profile-sidebar";
import { Camera, CreditCard, MapPin, ShoppingBag, X, Upload, Loader2 } from "lucide-react";
import { updateUser, updateUserAvatar } from "@/src/store/slices/userSlice";
import type { AppDispatch, RootState } from "@/src/store/index";
import FileUploader from "../common/file-uploader/file-uploader";

interface IProfileContentProps {
  user: any;
}

const ProfileContent: React.FC<IProfileContentProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.user);

  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [profileImage, setProfileImage] = useState<File[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  // Check for changes whenever formData updates
  useEffect(() => {
    const originalData = {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    };

    const keys = Object.keys(formData) as Array<keyof typeof formData>;
    const isChanged = keys.some(
      (key) =>
        String(formData[key]).toLowerCase().trim() !==
        String(originalData[key]).toLowerCase().trim(),
    );

    setHasChanges(isChanged);
  }, [formData, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };

  const getChangedFields = () => {
    const originalData = {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    };

    const changedFields: any = {
      user_id: user?.user_id,
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
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      const changedFields = getChangedFields();
      console.log("Sending only changed fields:", changedFields);

      const resultAction = await dispatch(updateUser(changedFields));

      if (updateUser.fulfilled.match(resultAction)) {
        setSaveSuccess(true);
        setHasChanges(false);

        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowUploader(false);
      setIsClosing(false);
      setProfileImage([]);
      setImageUploadError(null);
    }, 200);
  };

  const handleProfileImageChange = (files: File[]) => {
    setProfileImage(files);
    setImageUploadError(null);
    console.log("Profile image selected:", files);
  };

  const handleSaveProfileImage = async () => {
    if (profileImage.length === 0 || !user?.user_id) {
      console.error("No image selected or user ID missing");
      setImageUploadError("No image selected or user information missing");
      return;
    }

    try {
      const file = profileImage[0];
      console.log("Uploading profile image for user:", user.user_id);

      const resultAction = await dispatch(updateUserAvatar({
        userId: user.user_id,
        avatarFile: file
      }));

      if (updateUserAvatar.fulfilled.match(resultAction)) {
        // Success! Close the modal and show success message
        handleCloseModal();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        console.log("Profile image uploaded successfully:", resultAction.payload);
      } else {
        // Handle error from the thunk
        const errorMessage = resultAction.payload as string;
        setImageUploadError(errorMessage || "Failed to upload image");
      }

    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      setImageUploadError("An unexpected error occurred while uploading the image.");
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
          <p className="text-green-600 text-sm">
            Profile updated successfully!
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
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
          </button>
        </div>
        <div className="text-center mt-6">
          <h3 className="text-xl font-bold text-gray-900">
            {user?.first_name} {user?.last_name}
          </h3>
          <p className="text-gray-500 text-sm">{user?.email}</p>
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
            action={(e: any) => handleInputChange("last_name", e.target.value)}
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
            action={(e: any) => handleInputChange("email", e.target.value)}
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
            action={(e: any) => handleInputChange("phone", e.target.value)}
            className="w-full"
            disabled={loading}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          text={loading ? "Saving..." : "Save Changes"}
          action={handleSave}
          className={`
                        px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2
                        ${
                          hasChanges && !loading
                            ? "bg-[rgb(46,152,111)] text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                            : "bg-gray-200 !text-gray-400 cursor-not-allowed"
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
          <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-50"}`} onClick={!loading ? handleCloseModal : undefined}/>

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
                <button onClick={handleCloseModal} disabled={loading} className="w-8 h-8 bg-white bg-opacity-20 cursor-pointer rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">

              {/* Upload Error */}
              {imageUploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{imageUploadError}</p>
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
                  disabled={loading}
                  className="px-4 py-2 !bg-gray-200 !text-gray-700 hover:!bg-gray-300 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                />
                <Button
                  text={loading ? "Uploading..." : profileImage.length > 0 ? "Save Image" : "Choose Image"}
                  action={handleSaveProfileImage}
                  disabled={profileImage.length === 0 || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${ profileImage.length > 0 && !loading ? " !text-white !bg-[rgb(46,152,111)] shadow-lg hover:shadow-xl transform hover:scale-[1.01]" : "!bg-gray-300 !text-gray-500 cursor-not-allowed" }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileContent;