import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@src/index.css";
import App from "@/src/app";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { store } from "@src/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/auth-context";
import { StoreProvider } from "./context/store-context";
import { AdminProvider } from "./context/admin-context";

const queryCLient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false, 
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
        <Provider store={store}>
          <BrowserRouter>
              <QueryClientProvider client={queryCLient}>
                <AuthProvider>
                  <AdminProvider>
                    <StoreProvider>
                      <App />
                    </StoreProvider>
                  </AdminProvider>
                </AuthProvider>
              </QueryClientProvider>
          </BrowserRouter>
        </Provider>  
  </StrictMode>,
);
