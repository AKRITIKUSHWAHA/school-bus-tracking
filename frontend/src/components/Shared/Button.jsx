import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  isLoading = false, 
  className = "",
  disabled = false 
}) => {
  
  // Variants mapping
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200",
    secondary: "bg-yellow-500 hover:bg-yellow-600 text-slate-900 shadow-yellow-200",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-200",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors",
  };

  const baseStyles = "px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;