
import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from './icons';

// Augment Document interface to support View Transition API
declare global {
  interface Document {
    startViewTransition?: (callback: () => void) => {
      ready: Promise<void>;
      finished: Promise<void>;
      updateCallbackDone: Promise<void>;
    };
  }
}

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // If the browser doesn't support View Transitions, fall back to standard toggle
    if (!document.startViewTransition) {
      setTheme(newTheme);
      updateDOM(newTheme);
      return;
    }

    // Calculate click position for the circular reveal
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Start the transition
    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
      updateDOM(newTheme);
    });

    // Wait for the pseudo-elements to be ready
    await transition.ready;

    // Animate the NEW view expanding from the click point
    // Using a custom easing for a more "polished" feel
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 750, // Slower, more luxurious feel
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)', // Custom Power Ease (smooth acceleration/deceleration)
        pseudoElement: '::view-transition-new(root)', // Always animate the new view
      }
    );
  };

  const updateDOM = (newTheme: 'dark' | 'light') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-card/80 hover:bg-card border border-border/40 text-foreground/80 hover:text-primary transition-all duration-300 group overflow-hidden shadow-sm backdrop-blur-sm"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      <div className="relative w-5 h-5">
        <div className={`absolute inset-0 transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}>
          <MoonIcon className="w-5 h-5" />
        </div>
        <div className={`absolute inset-0 transform transition-transform duration-500 ${theme === 'light' ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`}>
          <SunIcon className="w-5 h-5" />
        </div>
      </div>
      <span className="sr-only">Toggle Theme</span>
    </button>
  );
};

export default ThemeToggle;
