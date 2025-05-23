import { Route, Routes } from "react-router";
import "@src/app.css";
import { Home } from "@src/routes";
import RootLayout from "@src/root-layout";

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
