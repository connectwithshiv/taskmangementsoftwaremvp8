import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import ChecklistService from '../../services/ChecklistService';
import { AlertBox } from '../shared/AlertBox';

/**
 * Correction View Modal - Shows unchecked checklist items
 * Displays the corrections required for revision-required tasks
 */
const CorrectionViewModal = ({ 
  task, 
  onClose,
  isDarkMode = false 
}) => {
  const [checklist, setChecklist] = useState(null);
  const [uncheckedItems, setUncheckedItems] = useState([]);

  useEffect(() => {
    if (task?.categoryId && task?.review?.approvedChecklistItems) {
      const list = ChecklistService.getChecklistByCategory(task.categoryId);
      setChecklist(list);
      
      // Find unchecked items
      if (list?.items) {
        const unchecked = list.items.filter(
          item => !task.review.approvedChecklistItems.includes(item.id)
        );
        setUncheckedItems(unchecked);
      }
    }
  }, [task]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-slate-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="text-orange-600" size={24} />
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Corrections Required
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Task: {task?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Admin Feedback */}
          {task?.review?.adminFeedback && (
            <AlertBox
              type="warning"
              message={
                <div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-900'}`}>
                    Admin Feedback:
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                    {task.review.adminFeedback}
                  </p>
                </div>
              }
              icon={AlertCircle}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Unchecked Items */}
          <div className={`p-6 rounded-xl border-2 ${
            isDarkMode 
              ? 'bg-slate-800 border-orange-500' 
              : 'bg-orange-50 border-orange-300'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-orange-600" size={24} />
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {uncheckedItems.length} Item(s) Need Attention
              </h3>
            </div>
            
            {uncheckedItems.length > 0 ? (
              <div className="space-y-3">
                {uncheckedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-lg border-2 ${
                      isDarkMode
                        ? 'bg-slate-700 border-red-500'
                        : 'bg-white border-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        ✗
                      </span>
                      <span className={`flex-1 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                No unchecked items found.
              </p>
            )}
          </div>

          {/* Action Info */}
          <AlertBox
            type="info"
            message="Please address the above items and resubmit your task for review."
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionViewModal;

