import { Input } from "@/src/components/common/input/input";
import { BASE_URL } from "@/src/utils/url";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

const Verification: React.FC = (): React.ReactElement => {

  const { user_id } = useParams();

  const location = useLocation();

  const [isSuccess, setIsSuccess] = useState<boolean>();
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const [otp, setOtp] = useState<number>(0);

  console.log(otp)

  // if (!otp) throw new Error("OTP not provided");

  const activateEmail = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
          body: JSON.stringify({
            user_id,
            otp
          })
        },
      );
      const data = await response.json();
      setIsSuccess(data.success);
      setMessage(data.message);
    } catch (error: unknown) {
      console.error(error);
      setIsSuccess(false);
      setMessage("An error occurred during verification");
    }
  };
console.log(message)
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <section className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-10 font-bold text-lg font-mono">Enter OTP</h1>
      <Input type="number" maxLength={6} className="font-mono" action={(e: any) => setOtp(e.target.value)}/>
      <button onClick={activateEmail}>Submit</button>
    </section>
  );
};

export default Verification;
