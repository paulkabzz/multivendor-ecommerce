import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Camera, Upload, X } from 'lucide-react';
import { Button } from '@/src/components/common/buttons/button';
import FileUploader from '@/src/components/common/file-uploader/file-uploader';
import defaultStore from '@assets/ui/default-store.png'
import { useAuth } from '@src/context/auth-context';
import { useStore } from '@src/context/store-context';
import { useNavigate } from 'react-router';

const CreateStore = () => {
  const { user } = useAuth();
  const { createStore, isCreateLoading, createError, resetCreateError, hasStore, store } = useStore();
  
  const [useProfileDetails, setUseProfileDetails] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    bio: '',
  });
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  
  const [showUploader, setShowUploader] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (hasStore) {
      navigate(`/my-store/${store?.vendor_id}`);
    }
  }, [hasStore]);

  // automaitcally fill form data when checkbox is toggled
  useEffect(() => {
    if (useProfileDetails && user) {
      setFormData({
        store_name: `${user.first_name} ${user.last_name}`.trim() || '',
        bio: `Welcome to ${user.first_name}'s store!` || '',
      });
      setPreviewUrl(user.avatar_url || '');
    } else if (!useProfileDetails) {
      setFormData({
        store_name: '',
        bio: '',
      });
      setPreviewUrl('');
    }
  }, [useProfileDetails, user]);

  useEffect(() => {
    if (createError) {
      resetCreateError();
    }
  }, [formData.store_name, formData.bio, createError, resetCreateError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowUploader(false);
      setIsClosing(false);
      setImageUploadError(null);
    }, 200);
  };

  const handleAvatarChange = (files: File[]) => {
    setAvatarFile(files);
    setImageUploadError(null);
    
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSaveAvatar = () => {
    if (avatarFile.length === 0) {
      setImageUploadError("Please select an image");
      return;
    }
    
    handleCloseModal();
  };

  const handleSubmit = async () => {
    if (!user?.user_id) {
      return;
    }

    if (!formData.store_name.trim() || formData.store_name.length < 2) {
      return;
    }

    try {
      const storeData = {
        store_name: formData.store_name,
        bio: formData.bio || undefined,
        avatar: avatarFile.length > 0 ? avatarFile[0] : undefined,
      };

      await createStore(storeData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/my-store/${store?.vendor_id}`);
      }, 2000);

    } catch (error) {
      console.error('Error creating store:', error);
    }
  };

  if (success) {
    return (
      <section className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Store Created Successfully!</h1>
          <p className="text-gray-600 mb-8">Your store has been created and is ready to go.</p>
          <Button
            text="Go to Dashboard"
            action={() => console.log('Navigate to dashboard')}
            className="w-full !bg-gradient-to-r !from-blue-600 !to-green-600 !text-white"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-white flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create Your Store</h1>
          <p className="text-gray-600">Set up your online presence and start selling</p>
        </div>

        {/* Error Display */}
        {createError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{createError}</p>
          </div>
        )}

        {/* Profile Details Checkbox */}
        {user && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-blue-100">
            <div className="flex items-start space-x-4">
              <div className="flex items-center h-6 mt-1">
                <input
                  id="use-profile"
                  type="checkbox"
                  checked={useProfileDetails}
                  onChange={(e) => setUseProfileDetails(e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="use-profile" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                  Use my profile details
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Automatically fill the form with your profile information
                </p>
                {useProfileDetails && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img
                          src={user.avatar_url || defaultStore}
                          alt={user.first_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Store Avatar Section */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Store Avatar
          </label>
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                <img
                  src={previewUrl || defaultStore}
                  alt="Store avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => setShowUploader(true)}
                className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110 transform hover:bg-blue-700"
                disabled={isCreateLoading}
              >
                {isCreateLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Camera size={18} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Optional - Upload an avatar for your store
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Store Name */}
          <div>
            <label htmlFor="store_name" className="block text-sm font-semibold text-gray-700 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              id="store_name"
              value={formData.store_name}
              placeholder="Enter your store name"
              onChange={(e) => handleInputChange('store_name', e.target.value)}
              disabled={useProfileDetails || isCreateLoading}
              className={`w-full px-4 py-3 rounded-xl border border-solid text-sm transition-all duration-200 ${
                useProfileDetails 
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200' 
                  : 'bg-white border-2 border-gray-200 focus:border-blue-500 focus:outline-none'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 2 characters required
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
              Store Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              placeholder="Tell customers about your store..."
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={useProfileDetails || isCreateLoading}
              className={`w-full px-4 py-3 border-solid rounded-xl border-2 text-sm transition-all duration-200 resize-none ${
                useProfileDetails 
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200' 
                  : 'bg-white border-gray-200 focus:border-blue-500 focus:outline-none'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional - Describe what you sell and what makes your store special
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              onClick={handleSubmit}
              disabled={isCreateLoading || !formData.store_name.trim() || formData.store_name.length < 2}
              className={`text-[14px] bg-[#131313] rounded-3xl py-2 w-full flex items-center justify-center space-x-2 ${
                isCreateLoading || !formData.store_name.trim() || formData.store_name.length < 2
                  ? ' text-primary-light cursor-not-allowed opacity-20 hover:opacity-25'
                  : 'opacity-95 text-white hover:opacity-100'
              }`}
            >
              {isCreateLoading && <Loader2 size={16} className="animate-spin" />}
              <span className='bg-transparent'>{isCreateLoading ? "Creating Store..." : "Create Store"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By creating a store, you agree to our{" "}
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* File Uploader Modal */}
      {showUploader && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${isClosing ? "opacity-0" : "opacity-100"}`}>
          {/* Backdrop */}
          <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-50"}`} onClick={!isCreateLoading ? handleCloseModal : undefined}/>

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
                      Upload Store Avatar
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Choose an image for your store
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleCloseModal} 
                  disabled={isCreateLoading} 
                  className="w-8 h-8 bg-white bg-opacity-20 cursor-pointer rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                <FileUploader fieldChange={handleAvatarChange} mediaUrl={previewUrl || ""}/>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p>Supported formats: PNG, JPG, JPEG, WEBP, SVG</p>
                <p className="text-xs">Maximum file size: 20MB</p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  text="Cancel"
                  action={handleCloseModal}
                  disabled={isCreateLoading}
                  className="px-4 py-2 !bg-gray-200 !text-gray-700 hover:!bg-gray-300 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                />
                <Button
                  text={avatarFile.length > 0 ? "Save Avatar" : "Choose Image"}
                  action={handleSaveAvatar}
                  disabled={avatarFile.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    avatarFile.length > 0 
                      ? "!text-white !bg-[rgb(46,152,111)] shadow-lg hover:shadow-xl transform hover:scale-[1.01]" 
                      : "!bg-gray-300 !text-gray-500 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CreateStore;