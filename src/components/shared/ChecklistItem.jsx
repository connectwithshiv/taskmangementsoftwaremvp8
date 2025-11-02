import React from 'react';
import { Check } from 'lucide-react';

/**
 * Enhanced Checklist Item Component
 * Provides consistent styling for checklist items with proper interactions
 */
export const ChecklistItem = ({ 
  item, 
  checked, 
  onChange, 
  disabled = false,
  showApprovedBadge = false,
  isDarkMode = false,
  className = ''
}) => {
  return (
    <label 
      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
        checked
          ? isDarkMode
            ? 'bg-blue-900/30 border-blue-500'
            : 'bg-blue-100 border-blue-400'
          : disabled
          ? isDarkMode
            ? 'bg-slate-700/50 border-slate-600 opacity-50 cursor-not-allowed'
            : 'bg-gray-50 border-gray-300 opacity-50 cursor-not-allowed'
          : isDarkMode
            ? 'bg-slate-700 border-slate-600 hover:border-blue-500 hover:bg-slate-700/90'
            : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked || false}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 text-blue-600 mt-1 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
      />
      <span className={`flex-1 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
        {item.text || item}
      </span>
      {checked && (
        <Check className="text-blue-600 mt-1 flex-shrink-0" size={20} />
      )}
      {showApprovedBadge && checked && (
        <div className="flex items-center gap-1 flex-shrink-0" title="Approved">
          <Check className="text-green-600 mt-1" size={16} />
          <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
            Approved
          </span>
        </div>
      )}
    </label>
  );
};

