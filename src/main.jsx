import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "./supComponentes/UserContext.jsx";
import { AuthProvider } from "./supComponentes/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <Router>
          <App />
        </Router>
      </UserProvider>
    </AuthProvider>
  </StrictMode>
);
