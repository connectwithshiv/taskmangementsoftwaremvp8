import React from 'react';

/**
 * Enhanced Section Card Component
 * Provides consistent styling for content sections with colored borders and backgrounds
 */
export const SectionCard = ({ 
  icon: Icon, 
  title, 
  children, 
  variant = 'default',
  isDarkMode = false,
  className = ''
}) => {
  const variants = {
    default: isDarkMode 
      ? 'bg-slate-800 border-blue-500' 
      : 'bg-blue-50 border-blue-300',
    success: isDarkMode 
      ? 'bg-slate-800 border-green-500' 
      : 'bg-green-50 border-green-300',
    warning: isDarkMode 
      ? 'bg-slate-800 border-amber-500' 
      : 'bg-amber-50 border-amber-300',
    danger: isDarkMode 
      ? 'bg-slate-800 border-red-500' 
      : 'bg-red-50 border-red-300',
    purple: isDarkMode 
      ? 'bg-slate-800 border-purple-500' 
      : 'bg-purple-50 border-purple-300',
    indigo: isDarkMode 
      ? 'bg-slate-800 border-indigo-500' 
      : 'bg-indigo-50 border-indigo-300'
  };

  const iconColors = {
    default: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };

  return (
    <div className={`p-6 rounded-xl border-2 shadow-sm ${variants[variant]} ${className}`}>
      {title && (
        <div className="flex items-center gap-3 mb-4">
          {Icon && <Icon className={iconColors[variant]} size={24} />}
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

