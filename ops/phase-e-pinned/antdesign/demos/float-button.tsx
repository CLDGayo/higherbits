import React from 'react';

// HigherBits Demo Wrapper for FloatButton
// Note: Upstream Ant Design FloatButton requires 'antd'.
export function FloatButtonDemo() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
      <button className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105" aria-label="Float action">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}

export default FloatButtonDemo;
