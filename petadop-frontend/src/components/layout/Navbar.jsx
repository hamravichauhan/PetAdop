// src/components/layout/Navbar.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { PawPrint, Plus, LogIn, User, LogOut, Moon, Sun } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useAuthStore } from "../../store/auth.js";

function useTheme() {
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("theme") || "dark"
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <PawPrint className="h-6 w-6 text-primary" />
          <span>PetAdop</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-4 md:flex">
          <NavLink
            to="/pets"
            className={({ isActive }) =>
              `rounded-xl px-3 py-1.5 hover:bg-muted ${
                isActive ? "bg-muted" : ""
              }`
            }
          >
            Browse
          </NavLink>
          {isAuthed && (
            <NavLink
              to="/new"
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 hover:bg-muted ${
                  isActive ? "bg-muted" : ""
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
                className="hidden sm:inline-flex"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
              <Button
                as={Link}
                to="/register"
                className="hidden sm:inline-flex"
              >
                <User className="mr-2 h-4 w-4" />
                Sign up
              </Button>
            </>
          ) : (
            <>
              {/* Show only when logged in */}
              <Button as={Link} to="/profile" variant="outline">
                <User className="mr-2 h-4 w-4" />
                {user?.username || "Me"}
              </Button>
              <Button
                onClick={() => {
                  logout();
                  nav("/");
                }}
                variant="ghost"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button as={Link} to="/new" className="hidden sm:inline-flex">
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
