import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon, 
  isLoading, 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 font-bold border-2 border-black rounded-lg transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50",
    secondary: "bg-gray-200 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-300",
    accent: "bg-[#B8FF9F] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#a3ff85]",
    danger: "bg-[#FF9F9F] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff8585]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed active:translate-x-0 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full block"></span>
      ) : icon}
      {children}
    </button>
  );
};

export default Button;