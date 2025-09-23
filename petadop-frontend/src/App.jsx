// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";

import Home from "./pages/Home.jsx";
import BrowsePets from "./pages/BrowsePets.jsx";
import PetDetails from "./pages/PetDetails.jsx";
import NewPet from "./pages/NewPet.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

import RequireAuth from "./components/layout/RequireAuth.jsx";
import { useAuthStore } from "./store/auth.js";

import ChatPage from "./pages/ChatPage.jsx";

const PageWrapper = ({ children }) => (
  <motion.main
    className="min-h-[calc(100vh-5rem)]"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
  >
    {children}
  </motion.main>
);

export default function App() {
  const location = useLocation();

  // Restore session on mount (reads token, hits /users/me)
  const loadMe = useAuthStore((s) => s.loadMe);
  useEffect(() => {
    loadMe?.();
  }, [loadMe]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />
          <Route
            path="/pets"
            element={
              <PageWrapper>
                <BrowsePets />
              </PageWrapper>
            }
          />
          <Route
            path="/pets/:id"
            element={
              <PageWrapper>
                <PetDetails />
              </PageWrapper>
            }
          />
          <Route path="/chat/:id" element={<ChatPage />} />

          {/* Protected routes */}
          <Route
            path="/new"
            element={
              <RequireAuth>
                <PageWrapper>
                  <NewPet />
                </PageWrapper>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <PageWrapper>
                  <Profile />
                </PageWrapper>
              </RequireAuth>
            }
          />

          {/* Public auth */}
          <Route
            path="/login"
            element={
              <PageWrapper>
                <Login />
              </PageWrapper>
            }
          />
          <Route
            path="/register"
            element={
              <PageWrapper>
                <Register />
              </PageWrapper>
            }
          />

          <Route
            path="*"
            element={
              <PageWrapper>
                <NotFound />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>

      <Footer />
    </div>
  );
}
