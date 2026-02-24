import React from 'react';
export default function Section({ children, id, className = '' }: { children: React.ReactNode; id?: string; className?: string }) {
  return <section id={id} className={className}>{children}</section>;
}
