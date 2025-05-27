import { BASE_URL } from "@/src/utils/url";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

const Activation: React.FC = (): React.ReactElement => {
  const { activation_token } = useParams();
  const [isSuccess, setIsSucess] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
      const activateEmail = async () => {
        try {
            if (activation_token) {
              const response = await fetch(`${BASE_URL}/verify-email`, {
                body: JSON.stringify(activation_token)
              });
              console.log(response.body);
              setIsSucess(true);
            };
          } catch (error: unknown) {
              console.error(error);
              setIsSucess(false);
          };
          
          activateEmail();
        };
  }, [activation_token]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <section className="w-full ">
        {
          isSuccess ? (
          <>
            <div></div>
          </>
        ) : 
        (<>
          <div></div>
        </>)
        }
    </section>
  );
};

export default Activation;