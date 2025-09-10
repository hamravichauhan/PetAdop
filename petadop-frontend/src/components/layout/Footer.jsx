import React from "react";
export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 py-8">
      <div className="mx-auto max-w-7xl px-4 text-sm text-mutedForeground">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p>© {new Date().getFullYear()} PetAdop. All rights reserved.</p>
          <p className="opacity-80">
            Built with ❤️ Pearl , rocky , rani , Patlu & family
          </p>
        </div>
      </div>
    </footer>
  );
}
