import React from 'react';

// HigherBits Demo Wrapper for Menu
// Note: Upstream Ant Design Menu requires 'antd' and '@rc-component/menu'.
export function MenuDemo() {
  return (
    <div className="w-64 bg-white border border-neutral-200 rounded-lg shadow-sm p-2 text-sm">
      <div className="px-3 py-2 font-semibold text-neutral-900 border-b border-neutral-100">Navigation Menu</div>
      <div className="mt-1 space-y-1">
        <div className="px-3 py-2 rounded bg-blue-50 text-blue-700 font-medium">Mail</div>
        <div className="px-3 py-2 rounded text-neutral-700 hover:bg-neutral-50 cursor-pointer">Navigation One</div>
        <div className="px-3 py-2 rounded text-neutral-700 hover:bg-neutral-50 cursor-pointer">Navigation Two</div>
      </div>
    </div>
  );
}

export default MenuDemo;
