import { Route, Routes } from "react-router";
import "./app.css";
import Home from "./pages/home/page";
import RootLayout from "./root-layout";

function App(): React.ReactElement {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
