import { Header } from "@components/navbar/header";
import { Footer } from "@components/Footer";
import { Outlet } from "react-router";
import { Nav } from "@components/navbar/nav";

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
