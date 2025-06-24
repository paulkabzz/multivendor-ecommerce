import { useState, useEffect } from 'react';
import { Store, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/common/buttons/button';
import { useAppSelector } from '@/src/store/hooks';
import { BASE_URL } from '@/src/utils/url';

const CreateStore = () => {
const {  user, token } = useAppSelector((state) => state.user);
    
  
  const [useProfileDetails, setUseProfileDetails] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    bio: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Update form data when checkbox is toggled
  useEffect(() => {
    if (useProfileDetails && user) {
      setFormData({
        store_name: `${user.first_name} ${user.last_name}`.trim() || '',
        bio: `Welcome to ${user.first_name}'s store!` || '',
        image_url: user.avatar_url || ''
      });
    } else if (!useProfileDetails) {
      setFormData({
        store_name: '',
        bio: '',
        image_url: ''
      });
    }
  }, [useProfileDetails, user]);

  const handleInputChange = (field: any, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!user?.user_id) {
      setError('Please log in to create a store');
      return;
    }

    if (!formData.store_name.trim() || formData.store_name.length < 2) {
      setError('Store name must be at least 2 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/create-store`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.user_id,
          store_name: formData.store_name.trim(),
          bio: formData.bio.trim() || null,
          image_url: formData.image_url || null
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      setSuccess(true);
      
      // Redirect to store dashboard or show success message
      setTimeout(() => {
        // Navigate to store dashboard
        // navigate('/store/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error creating store:', error);
      setError('Failed to create store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col justify-center items-center px-4">
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
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Store size={40} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create Your Store</h1>
          <p className="text-gray-600">Set up your online presence and start selling</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
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
                          src={user.avatar_url || '/default-avatar.png'}
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
              disabled={useProfileDetails || isSubmitting}
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
              Store Description
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              placeholder="Tell customers about your store..."
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={useProfileDetails || isSubmitting}
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

          {/* Store Image URL */}
          <div>
            <label htmlFor="image_url" className="block  text-sm font-semibold text-gray-700 mb-2">
              Store Image URL
            </label>
            <input
              type="url"
              id="image_url"
              value={formData.image_url}
              placeholder="https://example.com/store-image.jpg"
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              disabled={useProfileDetails || isSubmitting}
              className={`w-full px-4 border-solid py-3 rounded-xl border text-sm transition-all duration-200 ${
                useProfileDetails 
                  ? 'bg-gray-100 text-gray-600 border-solid cursor-not-allowed border-gray-200' 
                  : 'bg-white border-2 border-gray-200 focus:border-blue-500 focus:outline-none'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional - Add a logo or banner image for your store
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.store_name.trim() || formData.store_name.length < 2}
              className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center space-x-2 ${
                isSubmitting || !formData.store_name.trim() || formData.store_name.length < 2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              }`}
            >
              {isSubmitting && <Loader2 size={20} className="animate-spin" />}
              <span>{isSubmitting ? "Creating Store..." : "Create Store"}</span>
            </button>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Already have a store?{" "}
              <a href="/store/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                Go to Dashboard
              </a>
            </p>
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
    </section>
  );
};

export default CreateStore;