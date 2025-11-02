import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Workflow as WorkflowIcon, AlertCircle } from 'lucide-react';
import WorkflowService from '../../services/workflowService';

const WorkflowList = ({ onEdit, onView, onCreate, onDelete, isDarkMode = false }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadWorkflows();
    
    // Listen for updates
    const handleUpdate = () => {
      console.log('🔔 WorkflowList: Received workflowsUpdated event');
      loadWorkflows();
    };
    window.addEventListener('workflowsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('workflowsUpdated', handleUpdate);
    };
  }, []);

  const loadWorkflows = () => {
    console.log('📥 WorkflowList: loadWorkflows called');
    setLoading(true);
    try {
      const allWorkflows = WorkflowService.getAllWorkflows();
      console.log('📋 WorkflowList: Loaded', allWorkflows.length, 'workflows');
      setWorkflows(allWorkflows);
    } catch (error) {
      console.error('❌ Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workflowId) => {
    console.log('🗑️ WorkflowList handleDelete called for ID:', workflowId);
    if (onDelete) {
      console.log('📞 Using parent onDelete handler');
      // Use parent's delete handler if provided
      onDelete(workflowId);
      setDeleteConfirm(null);
      // Reload after a short delay to ensure event propagation
      setTimeout(() => {
        console.log('🔄 Forcing reload after parent delete');
        loadWorkflows();
      }, 100);
      return;
    }
    
    console.log('📦 Using local delete handler');
    // Otherwise use local handler
    const result = WorkflowService.deleteWorkflow(workflowId);
    console.log('✅ Delete result:', result);
    if (result.success) {
      setDeleteConfirm(null);
      loadWorkflows();
      alert('Workflow deleted successfully');
    } else {
      alert(result.message || 'Failed to delete workflow');
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Loading workflows...
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Task Dependency Templates
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage category-based task dependency chains
          </p>
        </div>
        <button
          onClick={onCreate}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus size={20} />
          Create Task Dependency
        </button>
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <div className={`p-12 text-center rounded-lg border-2 border-dashed ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <WorkflowIcon size={48} className={`mx-auto mb-4 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-lg font-semibold mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            No Task Dependencies Found
          </h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            Create your first task dependency to define task dependency chains
          </p>
          <button
            onClick={onCreate}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Create Task Dependency
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 hover:border-blue-600'
                  : 'bg-white border-gray-200 hover:border-blue-400'
              }`}
            >
              {/* Workflow Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    <WorkflowIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {workflow.name}
                    </h3>
                    {workflow.taskCount > 0 && (
                      <span className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Used in {workflow.taskCount} task(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {workflow.description && (
                <p className={`text-sm mb-4 line-clamp-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {workflow.description}
                </p>
              )}

              {/* Category Flow Preview */}
              <div className={`mb-4 p-3 rounded-lg ${
                isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
              }`}>
                <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Category Flow ({workflow.categoryFlow.length} stages):
                  </span>
                </div>
                <div className="space-y-1">
                  {workflow.categoryFlow.slice(0, 3).map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                        isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {stage.order}
                      </span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {stage.categoryName}
                      </span>
                    </div>
                  ))}
                  {workflow.categoryFlow.length > 3 && (
                    <div className={`text-xs italic ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      +{workflow.categoryFlow.length - 3} more stages
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                <button
                  onClick={() => onView(workflow)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Eye size={16} className="inline mr-1" />
                  View
                </button>
                <button
                  onClick={() => onEdit(workflow)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    console.log('🗑️ Trash button clicked for workflow:', workflow.id);
                    setDeleteConfirm(workflow.id);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  }`}
                  disabled={workflow.taskCount > 0}
                  title={workflow.taskCount > 0 ? 'Cannot delete: workflow is in use' : 'Delete workflow'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl max-w-md w-full mx-4 ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-600" size={24} />
              <h3 className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Confirm Delete
              </h3>
            </div>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowList;

