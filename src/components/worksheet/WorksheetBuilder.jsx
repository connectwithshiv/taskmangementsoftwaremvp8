// components/worksheet/WorksheetBuilder.jsx - Admin Worksheet Builder UI

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Eye, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import WorksheetService from '../../services/WorksheetService';

// Field type definitions
const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File Upload' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Button' }
];

/**
 * FieldEditor - Component to edit individual fields
 */
const FieldEditor = ({ field, index, totalFields, onUpdate, onDelete, onMove, onDuplicate }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border rounded-xl bg-gradient-to-br from-white to-gray-50 mb-4 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Field Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 flex items-center gap-3 rounded-t-xl border-b border-indigo-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200"
        >
          {expanded ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-indigo-600" />}
        </button>

        <span className="text-sm font-semibold text-gray-800 flex-1">
          {field.label || `Field ${index + 1}`}
        </span>

        {field.required && (
          <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">
            Required
          </span>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-2 hover:bg-white/80 rounded-lg disabled:opacity-30 transition-all duration-200"
            title="Move up"
          >
            <ChevronUp size={16} className="text-gray-600" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === totalFields - 1}
            className="p-2 hover:bg-white/80 rounded-lg disabled:opacity-30 transition-all duration-200"
            title="Move down"
          >
            <ChevronDown size={16} className="text-gray-600" />
          </button>
          <button onClick={onDuplicate} className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200" title="Duplicate">
            <Copy size={16} className="text-blue-600" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all duration-200" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Field Content */}
      {expanded && (
        <div className="p-5 space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Field Label *</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Project Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Field Type</label>
              <select
                value={field.type}
                onChange={(e) => onUpdate({ type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Default Value</label>
              <input
                type="text"
                value={field.defaultValue || ''}
                onChange={(e) => onUpdate({ defaultValue: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>

          {/* Options for dropdown/radio/checkbox */}
          {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
            <div>
              <label className="block text-xs font-medium mb-1">Options (one per line)</label>
              <textarea
                value={(field.options || []).join('\n')}
                onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(o => o.trim()) })}
                className="w-full px-2 py-1 border rounded text-sm"
                rows="3"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Required field</span>
          </label>
        </div>
      )}
    </div>
  );
};

/**
 * WorksheetBuilder - Main component for admin to create/edit worksheet templates
 */
const WorksheetBuilder = ({ onClose, categories = [] }) => {
  const [mode, setMode] = useState('list'); // 'list' or 'edit'
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    fields: []
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const data = WorksheetService.getAllTemplates();
    setTemplates(data);
  };

  const startNewTemplate = () => {
    setFormData({
      name: '',
      categoryId: '',
      description: '',
      fields: []
    });
    setSelectedTemplate(null);
    setMode('edit');
  };

  const editTemplate = (template) => {
    setFormData({ ...template });
    setSelectedTemplate(template);
    setMode('edit');
  };

  const saveTemplate = () => {
    if (!formData.name.trim()) {
      alert('Please enter template name');
      return;
    }
    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }
    if (formData.fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    if (selectedTemplate) {
      const result = WorksheetService.updateTemplate(selectedTemplate.id, formData);
      if (result.success) {
        loadTemplates();
        setMode('list');
        alert('Template updated successfully');
      } else {
        alert('Error: ' + result.message);
      }
    } else {
      const result = WorksheetService.createTemplate(formData);
      if (result.success) {
        loadTemplates();
        setMode('list');
        alert('Template created successfully');
      } else {
        alert('Error: ' + result.message);
      }
    }
  };

  const deleteTemplate = (templateId) => {
    if (confirm('Delete this template?')) {
      const result = WorksheetService.deleteTemplate(templateId);
      if (result.success) {
        loadTemplates();
        alert('Template deleted');
      }
    }
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      defaultValue: '',
      options: []
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });
  };

  const updateField = (fieldId, updates) => {
    setFormData({
      ...formData,
      fields: formData.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const deleteField = (fieldId) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(f => f.id !== fieldId)
    });
  };

  const moveField = (fieldId, direction) => {
    const index = formData.fields.findIndex(f => f.id === fieldId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.fields.length) return;

    const newFields = [...formData.fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

    setFormData({ ...formData, fields: newFields });
  };

  const duplicateField = (field) => {
    const newField = {
      ...field,
      id: `field_${Date.now()}`,
      label: `${field.label} (Copy)`
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });
  };

  // List Mode
  if (mode === 'list') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Worksheet Builder</h2>
              <p className="text-indigo-100 text-sm mt-1">Create and manage worksheet templates</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Templates</h3>
              <button
                onClick={startNewTemplate}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus size={18} /> New Template
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-700 mb-2">No templates yet</p>
                <p className="text-sm text-gray-500">Click "New Template" to create your first worksheet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(template => {
                  const category = categories.find(c => c.id === template.categoryId);
                  return (
                    <div key={template.id} className="bg-white border border-gray-200 rounded-xl p-5 flex justify-between items-center hover:shadow-lg transition-all duration-200 group">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1 text-lg">{template.name}</h4>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full font-medium">
                            {category?.name || 'Unknown Category'}
                          </span>
                          <span className="text-gray-500">
                            {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editTemplate(template)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setPreviewMode(true);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Eye size={16} /> Preview
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {previewMode && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedTemplate.name}</h3>
                    <p className="text-blue-100 text-sm mt-1">Template Preview</p>
                  </div>
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {selectedTemplate.fields.map((field, idx) => (
                  <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all duration-200">
                    <p className="font-semibold text-gray-900 mb-1">
                      {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium">
                        {field.type}
                      </span>
                      {field.placeholder && (
                        <span className="text-gray-500">Placeholder: "{field.placeholder}"</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {selectedTemplate ? 'Edit Template' : 'New Template'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {selectedTemplate ? 'Modify your worksheet template' : 'Create a new worksheet template'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('list')}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={saveTemplate}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Save size={18} /> Save Template
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50">
          {/* Template Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Template Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Code Review Checklist"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  rows="3"
                  placeholder="Describe what this worksheet is for..."
                />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Form Fields
              </h3>
              <button
                onClick={addField}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus size={18} /> Add Field
              </button>
            </div>

            <div className="space-y-3">
              {formData.fields.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <div className="mb-3">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700 mb-1">No fields yet</p>
                  <p className="text-sm text-gray-500">Click "Add Field" to create your first form field</p>
                </div>
              ) : (
                formData.fields.map((field, idx) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    index={idx}
                    totalFields={formData.fields.length}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onDelete={() => deleteField(field.id)}
                    onMove={(direction) => moveField(field.id, direction)}
                    onDuplicate={() => duplicateField(field)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorksheetBuilder;