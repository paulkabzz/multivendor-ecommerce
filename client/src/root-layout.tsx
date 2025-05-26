import { Header } from "@/src/components/common/navbar/header";
import { Footer } from "@/src/components/common/footer/footer";
import { Outlet } from "react-router";
import { Nav } from "@/src/components/common/navbar/nav";

const RootLayout: React.FC = (): React.ReactElement => {
  return (
    <>
      <Header />
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default RootLayout;
