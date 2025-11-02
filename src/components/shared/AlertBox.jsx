import React from 'react';

/**
 * Enhanced Alert Box Component
 * Provides consistent styling for alert messages with different types
 */
export const AlertBox = ({ 
  type = 'info', 
  message, 
  isDarkMode = false,
  className = '',
  icon: Icon = null
}) => {
  const variants = {
    info: isDarkMode 
      ? 'bg-blue-900/30 border border-blue-500 text-blue-400' 
      : 'bg-blue-100 border border-blue-300 text-blue-800',
    success: isDarkMode 
      ? 'bg-green-900/30 border border-green-500 text-green-400' 
      : 'bg-green-100 border border-green-300 text-green-800',
    warning: isDarkMode 
      ? 'bg-amber-900/30 border border-amber-500 text-amber-400' 
      : 'bg-amber-100 border border-amber-300 text-amber-800',
    danger: isDarkMode 
      ? 'bg-red-900/30 border border-red-500 text-red-400' 
      : 'bg-red-100 border border-red-300 text-red-800'
  };

  return (
    <div className={`p-4 rounded-lg flex items-start gap-3 ${variants[type]} ${className}`}>
      {Icon && <Icon size={20} className="flex-shrink-0 mt-0.5" />}
      {typeof message === 'string' ? (
        <p className="text-sm font-medium">{message}</p>
      ) : (
        message
      )}
    </div>
  );
};

