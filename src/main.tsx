import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.tsx";
import "./index.css";
import { auth0ProviderOptions } from "./config/auth0";
import { CartProvider } from "./contexts/CartContext";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider {...auth0ProviderOptions}>
      <QueryClientProvider client={queryClient}>
          <CartProvider>
            <App />
          </CartProvider>
      </QueryClientProvider>
    </Auth0Provider>
  </StrictMode>
);
