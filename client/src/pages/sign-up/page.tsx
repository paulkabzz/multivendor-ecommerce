import { Button } from "@/src/components/common/buttons/button";
import { Input } from "@/src/components/common/input/input";
import type { IUser } from "@utils/types";
import logo from "@assets/logo-2.png";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { signupUser, clearError, verifyOTP, resendOTP } from "@/src/store/slices/userSlice";

const SignUp: React.FC = (): React.ReactElement => {
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [user, setUser] = useState<IUser | any>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, signupSuccess } = useAppSelector(
    (state) => state.user,
  );
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate("/");
    }

    // Move to verification step if signup was successful
    if (signupSuccess && step === 'signup') {
      setStep('verify');
      startCountdown();
    }

    // Clear any previous errors when component mounts
    dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch, signupSuccess, step]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(60); // 60 seconds countdown
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUser({ ...user, [name]: value });
  };

  const handleOTPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    // Only allow numeric input and limit to 6 digits
    if (/^\d{0,6}$/.test(value)) {
      setOtpCode(value);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors = validateForm(user);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const { confirm_password, ...userData } = user;
      dispatch(signupUser(userData));
    }
  };

  const handleOTPSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit code" });
      return;
    }

    setErrors({});
    dispatch(verifyOTP({ email: user.email, otpCode }));
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      await dispatch(resendOTP({ email: user.email })).unwrap();
      startCountdown();
    } catch (error) {
      console.error('Failed to resend OTP:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const validateForm = (data: IUser & { confirm_password: string }) => {
    const errors: any = {};

    if (!data.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    if (!data.last_name.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (
      !/^[a-zA-z]{6}[0-9]{3}@myuct\.ac\.za$/i.test(
        data.email.trim().toLowerCase(),
      )
    ) {
      errors.email = data.email.trim() + " is not a valid UCT email.";
    }

    if (!data.password) {
      errors.password = "Password is required";
    } else if (
      data.password.length < 8 ||
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/.test(
        data.password,
      )
    ) {
      errors.password =
        "Password must contain at least 1 number, 1 uppercase letter, 1 special character, and must be at least 8 characters long.";
    }

    if (data.confirm_password !== data.password) {
      errors.confirm_password = "Passwords do not match";
    }

    return errors;
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'verify') {
    return (
      <section className="w-full flex flex-col justify-center items-center pt-10">
        <div className="flex gap-1 items-center">
          <img src={logo} alt="logo" className="w-[80px] h-[80px]" />
          <h1 className="font-[700] text-[2.5rem]">Verify Email</h1>
        </div>
        
        <div className="mt-10 text-center max-w-md">
          <p className="text-[14px] text-gray-600 mb-2">
            We've sent a 6-digit verification code to:
          </p>
          <p className="text-[14px] font-[600] text-[#131313] mb-6">
            {user.email}
          </p>
          <p className="text-[12px] text-gray-500 mb-8">
            Enter the code below to verify your email address
          </p>
        </div>

        <form className="flex flex-col gap-7 mt-4" onSubmit={handleOTPSubmit}>
          <div>
            <label htmlFor="otp" className="text-[12px] font-[600]">
              Verification Code
            </label>
            {errors.otp && (
              <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">
                {errors.otp}
              </p>
            )}
            <Input
              type="text"
              value={otpCode}
              name="otp"
              action={handleOTPChange}
              placeholder="123456"
              className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600] text-center !text-[18px] !font-[600] !tracking-[0.5em]"
              // maxLength={6}
            />
          </div>

          <div className="w-full mt-3">
            <Button
              text={loading ? "Verifying..." : "Verify Email"}
              className="!text-[12px] w-full"
              type="submit"
              disabled={loading || otpCode.length !== 6}
            />
            
            <div className="text-center mt-4">
              <p className="text-[12px] text-gray-600">
                Didn't receive the code?{" "}
                {countdown > 0 ? (
                  <span className="text-gray-400">
                    Resend in {formatCountdown(countdown)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                    className="text-link hover:underline"
                  >
                    {resendLoading ? "Sending..." : "Resend code"}
                  </button>
                )}
              </p>
            </div>

            <p className="text-[12px] mt-3 text-center">
              Want to use a different email?{" "}
              <button
                type="button"
                onClick={() => {
                  setStep('signup');
                  setOtpCode('');
                  setErrors({});
                  dispatch(clearError());
                }}
                className="text-link hover:underline"
              >
                Go back
              </button>
            </p>
          </div>

          {error && (
            <p className="text-[rgb(255,0,0)] text-[14px] font-[600] py-2 w-full text-center">
              {error}
            </p>
          )}
        </form>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col justify-center items-center pt-10">
      <div className="flex gap-1 items-center">
        <img src={logo} alt="logo" className="w-[80px] h-[80px]" />
        <h1 className="font-[700] text-[2.5rem]">Sign Up</h1>
      </div>
      <form className="flex flex-col gap-7 mt-10" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="first_name" className="text-[12px] font-[600]">
            First Name
          </label>
          {errors.first_name && (
            <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">
              {errors.first_name}
            </p>
          )}
          <Input
            type="text"
            value={user.first_name}
            name="first_name"
            action={handleChange}
            placeholder="John"
            className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]"
          />
        </div>
        <div>
          <label htmlFor="Last Name" className="text-[12px] font-[600]">
            Last Name
          </label>
          {errors.last_name && (
            <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">
              {errors.last_name}
            </p>
          )}
          <Input
            type="text"
            value={user.last_name}
            name="last_name"
            placeholder="Doe"
            action={handleChange}
            className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]"
          />
        </div>
        <div>
          <label htmlFor="Email" className="text-[12px] font-[600]">
            Email
          </label>
          {errors.email && (
            <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">
              {errors.email}
            </p>
          )}
          <Input
            type="email"
            value={user.email}
            name="email"
            placeholder="johndoes@example.com"
            action={handleChange}
            className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-[12px] font-[600]">
            Password
          </label>
          {errors.password && (
            <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">
              {errors.password}
            </p>
          )}
          <Input
            type="password"
            value={user.password}
            name="password"
            action={handleChange}
            className="!text-[#131313] !bg-[#ddd] !w-[350px]"
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className="text-[12px] font-[600]">
            Confirm Password
          </label>
          {errors.confirm_password && (
            <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">
              {errors.confirm_password}
            </p>
          )}
          <Input
            type="password"
            value={user.confirm_password}
            name="confirm_password"
            action={handleChange}
            className="!text-[#131313] !bg-[#ddd] !w-[350px]"
          />
        </div>
        <div className="w-full mt-3">
          <Button
            text={loading ? "Signing up..." : "Sign Up"}
            className="!text-[12px] w-full"
            type="submit"
            disabled={loading}
          />
          <p className="text-[12px] mt-3">
            Already have an account?{" "}
            <Link to={"/login"} className="text-link">
              Log in
            </Link>
          </p>
        </div>
        {error && (
          <p className="text-[rgb(255,0,0)] text-[14px] font-[600] py-2 w-full text-center">
            {error}
          </p>
        )}
      </form>
    </section>
  );
};

export default SignUp;