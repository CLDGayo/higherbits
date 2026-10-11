import React from 'react';
import FloatingActionMenu from '../source/21st/floating-action-menu';

// HigherBits Demo Wrapper for Floating Action Menu
export function FloatingActionMenuDemo() {
  return (
    <div className="relative w-full h-[320px] flex items-center justify-center bg-neutral-900/5 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8">
      <div className="text-sm text-neutral-500">Interactive Floating Action Menu in bottom corner</div>
      <FloatingActionMenu
        className="absolute bottom-6 right-6"
        options={[
          {
            label: "Account",
            Icon: <span className="w-4 h-4 flex items-center justify-center text-xs">👤</span>,
            onClick: () => console.log("Account clicked"),
          },
          {
            label: "Settings",
            Icon: <span className="w-4 h-4 flex items-center justify-center text-xs">⚙️</span>,
            onClick: () => console.log("Settings clicked"),
          },
          {
            label: "Logout",
            Icon: <span className="w-4 h-4 flex items-center justify-center text-xs">🚪</span>,
            onClick: () => console.log("Logout clicked"),
          },
        ]}
      />
    </div>
  );
}

export default FloatingActionMenuDemo;
