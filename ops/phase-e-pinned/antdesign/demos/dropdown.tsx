import React from 'react';

// HigherBits Demo Wrapper for Dropdown
// Note: Upstream Ant Design Dropdown component requires 'antd' and '@ant-design/icons'.
export function DropdownDemo() {
  return (
    <div className="relative inline-block text-left">
      <button className="px-4 py-2 bg-white border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 shadow-sm">
        Hover me
        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

export default DropdownDemo;
