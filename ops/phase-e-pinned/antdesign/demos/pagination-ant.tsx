import React from 'react';

// HigherBits Demo Wrapper for Pagination Ant
// Note: Upstream Ant Design Pagination requires 'antd'.
export function PaginationAntDemo() {
  return (
    <div className="flex items-center space-x-1 text-sm font-medium">
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-50">&lt;</button>
      <button className="px-3 py-1 rounded bg-blue-600 text-white font-semibold">1</button>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">2</button>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">3</button>
      <span className="px-2 text-neutral-400">...</span>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">10</button>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-50">&gt;</button>
    </div>
  );
}

export default PaginationAntDemo;
