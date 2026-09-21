import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'surface' | 'accent';
}

export function Card({ children, className = '', variant = 'default', ...props }: CardProps) {
  const base = 'transition-all duration-100 rounded-none';
  const variants = {
    default: 'bg-[#111113] border border-[#262626]',
    surface: 'bg-[#161619] border border-[#262626]',
    accent: 'bg-[#111113] border-l-4 border-l-[#dc2626] border-y border-r border-[#262626]',
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-black transition-all active:translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer tracking-wider uppercase text-xs rounded-none border';

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px] gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-6 py-2.5 text-sm gap-2.5',
  };

  const variants = {
    primary: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border-[#dc2626]',
    secondary: 'bg-[#18181b] text-neutral-200 hover:text-white hover:bg-[#222226] border-[#333338]',
    danger: 'bg-[#3b0d0c] text-red-400 hover:bg-[#4c1312] border-[#7f1d1d]',
    ghost: 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent',
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className={`relative w-full ${maxWidth} bg-[#111113] border-2 border-[#333338] shadow-2xl p-5 sm:p-6 z-10 max-h-[92vh] overflow-y-auto rounded-none`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4 bg-[#dc2626]" />
            <h3 className="text-sm sm:text-base font-black tracking-wider text-white uppercase">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-xs font-mono font-bold"
          >
            [ESC]
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
