import React from 'react';

// HigherBits Demo Wrapper for Breadcrumb
// Note: Upstream Ant Design Breadcrumb component requires the full 'antd' runtime.
export function BreadcrumbDemo() {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-neutral-500">
      <a href="#" className="hover:text-neutral-900 transition-colors">Home</a>
      <span className="text-neutral-400">/</span>
      <a href="#" className="hover:text-neutral-900 transition-colors">Application Center</a>
      <span className="text-neutral-400">/</span>
      <span className="font-medium text-neutral-900">Breadcrumb</span>
    </nav>
  );
}

export default BreadcrumbDemo;
