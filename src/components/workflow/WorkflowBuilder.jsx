import React, { useState, useEffect } from 'react';
import { X, Plus, GripVertical, Trash2, Save, AlertCircle } from 'lucide-react';
import WorkflowService from '../../services/workflowService';

const WorkflowBuilder = ({ workflow = null, categories = [], onSave, onCancel, isDarkMode = false, viewMode = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryFlow: []
  });
  const [errors, setErrors] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name || '',
        description: workflow.description || '',
        categoryFlow: workflow.categoryFlow || []
      });
    }
  }, [workflow]);

  // Filter available categories (exclude already selected ones)
  const availableCategories = categories.filter(cat => {
    if (!formData.categoryFlow || formData.categoryFlow.length === 0) return true;
    return !formData.categoryFlow.some(stage => stage.categoryId === cat.id);
  });

  const handleAddCategory = () => {
    if (!selectedCategoryId) {
      setErrors({ ...errors, categoryFlow: 'Please select a category' });
      return;
    }

    const category = categories.find(c => c.id === selectedCategoryId);
    if (!category) return;

    // Check if already added
    if (formData.categoryFlow.some(stage => stage.categoryId === selectedCategoryId)) {
      setErrors({ ...errors, categoryFlow: 'Category already added to workflow' });
      return;
    }

    const newStage = {
      categoryId: category.id,
      categoryName: category.name || category.title || 'Unnamed Category',
      order: formData.categoryFlow.length + 1
    };

    setFormData({
      ...formData,
      categoryFlow: [...formData.categoryFlow, newStage]
    });
    setSelectedCategoryId('');
    setErrors({ ...errors, categoryFlow: '' });
  };

  const handleRemoveCategory = (index) => {
    const newFlow = formData.categoryFlow.filter((_, i) => i !== index);
    // Reorder
    const reorderedFlow = newFlow.map((stage, idx) => ({
      ...stage,
      order: idx + 1
    }));
    setFormData({
      ...formData,
      categoryFlow: reorderedFlow
    });
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newFlow = [...formData.categoryFlow];
    [newFlow[index - 1], newFlow[index]] = [newFlow[index], newFlow[index - 1]];
    // Reorder
    const reorderedFlow = newFlow.map((stage, idx) => ({
      ...stage,
      order: idx + 1
    }));
    setFormData({
      ...formData,
      categoryFlow: reorderedFlow
    });
  };

  const handleMoveDown = (index) => {
    if (index === formData.categoryFlow.length - 1) return;
    const newFlow = [...formData.categoryFlow];
    [newFlow[index], newFlow[index + 1]] = [newFlow[index + 1], newFlow[index]];
    // Reorder
    const reorderedFlow = newFlow.map((stage, idx) => ({
      ...stage,
      order: idx + 1
    }));
    setFormData({
      ...formData,
      categoryFlow: reorderedFlow
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!formData.name.trim()) {
      newErrors.name = 'Task dependency name is required';
    }

    if (formData.categoryFlow.length < 2) {
      newErrors.categoryFlow = 'Task dependency must have at least 2 categories';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validate workflow
    const validation = WorkflowService.validateWorkflow(formData);
    if (!validation.isValid) {
      setErrors({ categoryFlow: validation.errors.join(', ') });
      return;
    }

    // Save
    if (workflow) {
      const result = WorkflowService.updateWorkflow(workflow.id, formData);
      if (result.success) {
        onSave(result.workflow);
      } else {
        alert(result.message || 'Failed to update task dependency');
      }
    } else {
      const result = WorkflowService.createWorkflow({
        ...formData,
        createdBy: 'admin' // TODO: Get from auth context
      });
      if (result.success) {
        onSave(result.workflow);
      } else {
        alert(result.message || 'Failed to create task dependency');
      }
    }
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {viewMode ? 'View Task Dependency' : workflow ? 'Edit Task Dependency' : 'Create New Task Dependency'}
        </h2>
        <button
          onClick={onCancel}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Task Dependency Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setErrors({ ...errors, name: '' });
            }}
            disabled={viewMode}
            className={`w-full px-4 py-2 rounded-lg border-2 ${
              errors.name
                ? 'border-red-500'
                : isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
            placeholder="e.g., Design → Development → Testing"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={viewMode}
            rows={3}
            className={`w-full px-4 py-2 rounded-lg border-2 ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
            placeholder="Describe the task dependency purpose..."
          />
        </div>

        {/* Category Flow */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Category Flow <span className="text-red-500">*</span>
            <span className="text-xs font-normal ml-2 text-gray-500">
              (Minimum 2 categories required)
            </span>
          </label>

          {/* Add Category */}
          {!viewMode && (
            <div className="flex gap-2 mb-4">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select a category...</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || cat.title || 'Unnamed Category'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!selectedCategoryId || availableCategories.length === 0}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  !selectedCategoryId || availableCategories.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          )}

          {/* Category List */}
          {formData.categoryFlow.length > 0 ? (
            <div className={`space-y-2 p-4 rounded-lg border-2 ${
              errors.categoryFlow
                ? 'border-red-500'
                : isDarkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-gray-50 border-gray-300'
            }`}>
              {formData.categoryFlow.map((stage, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-white border border-gray-200'
                  }`}
                >
                  <GripVertical className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} cursor-move`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {stage.order}
                  </div>
                  <span className={`flex-1 font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stage.categoryName}
                  </span>
                  {!viewMode && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`p-1.5 rounded ${
                          index === 0
                            ? 'opacity-30 cursor-not-allowed'
                            : isDarkMode
                            ? 'hover:bg-slate-600 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === formData.categoryFlow.length - 1}
                        className={`p-1.5 rounded ${
                          index === formData.categoryFlow.length - 1
                            ? 'opacity-30 cursor-not-allowed'
                            : isDarkMode
                            ? 'hover:bg-slate-600 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(index)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? 'hover:bg-red-900/30 text-red-400'
                            : 'hover:bg-red-50 text-red-600'
                        }`}
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
              isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-gray-50'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No categories added yet. Add at least 2 categories to create a workflow.
              </p>
            </div>
          )}

          {errors.categoryFlow && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle size={16} />
              {errors.categoryFlow}
            </p>
          )}
        </div>

        {/* Actions */}
        {!viewMode && (
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {workflow ? 'Update Task Dependency' : 'Create Task Dependency'}
            </button>
          </div>
        )}
        {viewMode && (
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Close
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default WorkflowBuilder;

