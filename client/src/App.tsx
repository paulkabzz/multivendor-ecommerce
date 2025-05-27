import { Route, Routes } from "react-router";
import "@src/app.css";
import { BestSelling, Contact, Events, FAQ, Home, Login, NotFound, ProductDetails, Products, SignUp, Verification } from "@src/routes";
import RootLayout from "@src/root-layout";

function App(): React.ReactElement {

  return (
    <>
      <Routes>
        <Route path="/" element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="/verify-email" element={<Verification />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/product-details/:product_id" element={<ProductDetails />} />
            <Route path="/products" element={<Products />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/event" element={<Events />} />
            <Route path="/best-selling" element={<BestSelling />} />

            {/* Protected Routes */}
            
            {/* <ProtectedRoute>
                <Route path="/profile/:user_id" element={<Profile />} />
                <Route path="checkout/:user_id" element={<Checkout />} />
            </ProtectedRoute> */}

            {/* Not Found */}
            <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
