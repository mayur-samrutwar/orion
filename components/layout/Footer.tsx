import Link from "next/link";
import React from "react";

export function Footer() {
  return (
    <footer className="w-full py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm">
        <div className="text-black/70 dark:text-white/70">© 2025 Orion</div>
        <nav className="flex items-center justify-center gap-6">
          <Link className="hover:text-black/60 dark:hover:text-white/80" href="#">Privacy Policy</Link>
          <Link className="hover:text-black/60 dark:hover:text-white/80" href="#">Terms of Service</Link>
        </nav>
        <div className="flex items-center justify-end gap-4">
          <Link className="hover:opacity-80" href="#" aria-label="Twitter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.2 1.7-2.1-.8.5-1.7.8-2.6 1A4 4 0 0 0 12 8.5c0 .3 0 .6.1.9-3.3-.2-6.2-1.7-8.2-4.1-.4.7-.6 1.4-.6 2.2 0 1.5.8 2.8 2 3.6-.6 0-1.2-.2-1.7-.5 0 2.1 1.5 3.9 3.6 4.3-.4.1-.8.1-1.2.1-.3 0-.6 0-.8-.1.6 1.8 2.3 3.1 4.3 3.1A8.1 8.1 0 0 1 2 19.3 11.5 11.5 0 0 0 8.3 21c7 0 10.8-5.8 10.8-10.8v-.5c.7-.5 1.3-1.1 1.7-1.9Z"/></svg>
          </Link>
          <Link className="hover:opacity-80" href="#" aria-label="Discord">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A17 17 0 0 0 15.9 3l-.2.3c2 .6 3.1 1.5 3.1 1.5-1.3-.6-2.5-1-3.6-1.2a10.8 10.8 0 0 0-2.6 0c-1.1.1-2.3.5-3.6 1.2 0 0 1-1 3.1-1.5L9.9 3a17 17 0 0 0-4.4 1.4C2.6 6.8 2 10.4 2 14v.1c1.6 1.3 3.5 2.2 5.6 2.7l.4-.6c-1-.3-2-.7-3-1.3l.2-.1c.2.1.5.2.7.3 2 .8 4.1 1.2 6.3 1.2s4.3-.4 6.3-1.2l.7-.3h.1c-1 .6-2 1-3 1.3l.5.6c2.1-.5 4-1.4 5.6-2.7V14c0-3.6-.6-7.2-3.2-9.6ZM9.5 13.5c-.6 0-1.2-.6-1.2-1.4 0-.7.5-1.4 1.2-1.4s1.2.6 1.2 1.4-.5 1.4-1.2 1.4Zm5 0c-.6 0-1.2-.6-1.2-1.4 0-.7.5-1.4 1.2-1.4s1.2.6 1.2 1.4-.6 1.4-1.2 1.4Z"/></svg>
          </Link>
          <Link className="hover:opacity-80" href="#" aria-label="Github">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.2c-3.4.7-4.2-1.6-4.2-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.6.1-.6 1.2.1 1.8 1.3 1.8 1.3 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.6-1.4-5.6-6.2 0-1.4.5-2.5 1.3-3.4-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.4 1.3a11.6 11.6 0 0 1 6.2 0c2.4-1.6 3.4-1.3 3.4-1.3.7 1.7.2 3 .1 3.3.8.9 1.3 2 1.3 3.4 0 4.8-2.9 5.9-5.6 6.2.5.4.8 1.1.8 2.3v3.3c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}


