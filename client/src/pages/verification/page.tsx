import { BASE_URL } from "@/src/utils/url";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

const Verification: React.FC = (): React.ReactElement => {
  const location = useLocation();
  const verification_token = new URLSearchParams(location.search).get('token');
  const [isSuccess, setIsSuccess] = useState<boolean>();
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (verification_token) {
      const activateEmail = async () => {
        try {
          const response = await fetch(`${BASE_URL}/verify-email?token=${verification_token}`, {
            method: "GET",
          });
          
          const data = await response.json();
          setIsSuccess(data.success);
          setMessage(data.message);
        } catch (error: unknown) {
          console.error(error);
          setIsSuccess(false);
          setMessage("An error occurred during verification");
        }
      };
      
      activateEmail();
    }
  }, [verification_token]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <section className="w-full h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        {isSuccess === undefined ? (
          <div className="animate-pulse">
            <h2 className="text-xl font-semibold mb-4">Verifying your email...</h2>
            <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : isSuccess ? (
          <div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified!</h2>
            <p className="mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to homepage in 5 seconds...</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
            <p className="mb-4">{message}</p>
            <button 
              onClick={() => navigate('/')} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Return to Homepage
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Verification;