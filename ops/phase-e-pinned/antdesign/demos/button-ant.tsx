import React from 'react';

// HigherBits Demo Wrapper for Button Ant
// Note: Upstream Ant Design Button component requires the full 'antd' runtime and style engine.
export function ButtonAntDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors">
        Primary Button
      </button>
      <button className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-md text-sm font-medium shadow-sm transition-colors">
        Default Button
      </button>
      <button className="px-4 py-2 bg-transparent hover:bg-neutral-100 text-neutral-600 rounded-md text-sm font-medium transition-colors">
        Text Button
      </button>
    </div>
  );
}

export default ButtonAntDemo;
