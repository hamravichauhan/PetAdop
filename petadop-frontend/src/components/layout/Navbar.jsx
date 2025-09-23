// src/components/layout/Navbar.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  PawPrint,
  Plus,
  LogIn,
  User,
  LogOut,
  Moon,
  Sun,
  Heart,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import { useAuthStore } from "../../store/auth.js";

function useTheme() {
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("theme") || "light"
  );

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}

export default function Navbar() {
  const { isAuthed, user, logout } = useAuthStore();
  const nav = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-pink-200/30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-pink-700"
        >
          <div className="relative">
            <PawPrint className="h-6 w-6 text-pink-500" />
            <Heart
              className="h-3 w-3 text-pink-600 absolute -top-1 -right-1"
              fill="currentColor"
            />
          </div>
          <span className="bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent font-bold">
            PetAdopt
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <NavLink
            to="/pets"
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 transition-all duration-200 hover:bg-pink-100/50 ${
                isActive
                  ? "bg-pink-100 text-pink-700 font-medium"
                  : "text-pink-600"
              }`
            }
          >
            Browse Pets
          </NavLink>
          {isAuthed && (
            <NavLink
              to="/new"
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 transition-all duration-200 hover:bg-pink-100/50 ${
                  isActive
                    ? "bg-pink-100 text-pink-700 font-medium"
                    : "text-pink-600"
                }`
              }
            >
              List a Pet
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="text-pink-600 hover:bg-pink-100/50"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {!isAuthed ? (
            <>
              {/* Show only when not logged in */}
              <Button
                as={Link}
                to="/login"
                variant="outline"
                className="hidden sm:inline-flex border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
              <Button
                as={Link}
                to="/register"
                className="hidden sm:inline-flex bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 text-white"
              >
                <User className="mr-2 h-4 w-4" />
                Sign up
              </Button>
            </>
          ) : (
            <>
              {/* Show only when logged in */}
              <Button
                as={Link}
                to="/profile"
                variant="outline"
                className="border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                <User className="mr-2 h-4 w-4" />
                {user?.username || "Me"}
              </Button>
              <Button
                onClick={() => {
                  logout();
                  nav("/");
                }}
                variant="ghost"
                className="text-pink-600 hover:bg-pink-100/50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button
                as={Link}
                to="/new"
                className="hidden sm:inline-flex bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Post
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
