import { Navbar } from "./components/navbar/Navbar";
import { Footer } from "./components/Footer";
import { Outlet } from "react-router";

const RootLayout = () => {
    return (
        <>
            <Navbar />
                <main>
                    <Outlet />
                </main>
            <Footer />
        </>
    )
}

export default RootLayout;