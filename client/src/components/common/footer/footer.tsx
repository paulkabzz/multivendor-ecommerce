import { Link } from "react-router";

export const Footer: React.FC = (): React.ReactElement => {
  return (
      <>
          <footer className="w-full bg-[#131313] mt-10 min-h-[10vh] flex justify-center items-center">
              <div className="w-full text-center text-[12px] text-white">
                  <p>
                      Copyright &copy; 2022-{new Date().getFullYear()} <Link className="text-[#ddd]" to={'https://github.com/paulkabzz'} target="_blank">Paul Kabulu</Link>. All rights reserved.
                  </p>
              </div>
          </footer>
      </>
  );
};
