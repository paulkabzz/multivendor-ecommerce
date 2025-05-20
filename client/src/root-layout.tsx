import { Outlet } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

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