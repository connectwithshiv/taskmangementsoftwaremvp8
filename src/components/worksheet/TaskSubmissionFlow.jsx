import React, { useState, useEffect } from 'react';
import { FileText, X, Send, AlertCircle, CheckCircle, Loader, BookOpen, ListTodo, ArrowRight, Check } from 'lucide-react';
import GuidelineService from '../../services/GuidelineService';
import ChecklistService from '../../services/ChecklistService';
import { SectionCard } from '../shared/SectionCard';
import { ChecklistItem } from '../shared/ChecklistItem';
import { AlertBox } from '../shared/AlertBox';

/**
 * ==========================================
 * TASK SUBMISSION FLOW - 4 Steps
 * ==========================================
 * Step 1: View Guidelines & Confirm
 * Step 2: Complete Checklist
 * Step 3: Fill Worksheet
 * Step 4: Submit Task
 */
const TaskSubmissionFlow = ({ 
  task, 
  template, 
  onSubmit, 
  onCancel,
  isDarkMode = false 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [guideline, setGuideline] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [guidelineViewed, setGuidelineViewed] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Load guideline and checklist
  useEffect(() => {
    if (task?.categoryId) {
      const guideline = GuidelineService.getGuidelineByCategory(task.categoryId);
      const checklist = ChecklistService.getChecklistByCategory(task.categoryId);
      
      setGuideline(guideline);
      setChecklist(checklist);
      
      // Initialize checklist items
      if (checklist?.items) {
        const initialChecked = {};
        checklist.items.forEach(item => {
          // If task is revision-required and admin has approved this item, mark it as checked
          const isApprovedByAdmin = task.status === 'revision-required' && 
                                    task.review?.approvedChecklistItems?.includes(item.id);
          initialChecked[item.id] = isApprovedByAdmin;
        });
        setCheckedItems(initialChecked);
      }
    }
  }, [task]);

  // Initialize worksheet form
  useEffect(() => {
    if (template && template.fields) {
      const initialData = {};
      template.fields.forEach(field => {
        initialData[field.id] = field.defaultValue || '';
      });
      setFormData(initialData);
    }
  }, [template]);

  const steps = [
    { id: 1, name: 'Guidelines', icon: BookOpen },
    { id: 2, name: 'Checklist', icon: ListTodo },
    { id: 3, name: 'Worksheet', icon: FileText },
    { id: 4, name: 'Submit', icon: Send }
  ];

  // Next step handler
  const handleNext = () => {
    if (currentStep === 1) {
      if (!guidelineViewed && guideline) {
        alert('Please read the guidelines and check the confirmation box');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (checklist) {
        const allChecked = Object.values(checkedItems).every(checked => checked);
        if (!allChecked) {
          alert('Please check all items in the checklist');
          return;
        }
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateForm()) {
        return;
      }
      setCurrentStep(4);
    }
  };

  // Previous step handler
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validate worksheet form
  const validateForm = () => {
    if (!template) return true;
    
    const newErrors = {};
    
    template.fields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required && !value) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }

      if (field.type === 'number' && value && isNaN(value)) {
        newErrors[field.id] = `${field.label} must be a number`;
      }

      if (field.type === 'email' && value && !value.includes('@')) {
        newErrors[field.id] = `${field.label} must be a valid email`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle checklist item toggle
  const handleChecklistToggle = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Handle field change
  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Handle final submission
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const submissionData = {
        taskId: task.id,
        templateId: template?.id,
        templateName: template?.name,
        categoryId: task.categoryId,
        data: formData,
        guidelineViewed: guidelineViewed,
        checklistCompleted: Object.values(checkedItems).every(c => c)
      };

      await onSubmit(submissionData);
      setSubmitStatus('success');
      
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render field based on type
  const renderField = (field) => {
    const baseInputClass = `w-full px-4 py-2 rounded-lg border ${
      errors[field.id]
        ? 'border-red-500 focus:ring-red-500'
        : isDarkMode
          ? 'border-slate-600 focus:ring-blue-500'
          : 'border-gray-300 focus:ring-blue-500'
    } ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-white'} focus:ring-2 focus:outline-none`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseInputClass}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseInputClass}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            className={baseInputClass}
          />
        );

      case 'dropdown':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className={`flex items-center gap-2 cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className={`flex items-center gap-2 cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={formData[field.id]?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = formData[field.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleFieldChange(field.id, newValues);
                  }}
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'email':
        return (
          <input
            type="email"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseInputClass}
          />
        );

      default:
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseInputClass}
          />
        );
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Guidelines
        return (
          <div className="space-y-6">
            {/* Admin Feedback for Revision Required Tasks */}
            {task?.status === 'revision-required' && task?.review?.adminFeedback && (
              <AlertBox
                type="danger"
                message={
                  <>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>
                      Admin Feedback (Revision Required)
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                      {task.review.adminFeedback}
                    </p>
                  </>
                }
                icon={AlertCircle}
                isDarkMode={isDarkMode}
              />
            )}

            <SectionCard
              icon={BookOpen}
              title={guideline?.title || 'Guidelines'}
              variant="success"
              isDarkMode={isDarkMode}
            >
              {guideline ? (
                <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                  <pre className={`whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                    {guideline.content}
                  </pre>
                </div>
              ) : (
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No guidelines available for this category.
                </p>
              )}
            </SectionCard>

            <label className={`flex items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${
              guidelineViewed
                ? isDarkMode
                  ? 'bg-green-900/30 border-green-500'
                  : 'bg-green-100 border-green-300'
                : isDarkMode
                  ? 'bg-slate-700 border-slate-600 hover:border-green-500'
                  : 'bg-white border-gray-300 hover:border-green-400'
            }`}>
              <input
                type="checkbox"
                checked={guidelineViewed}
                onChange={(e) => setGuidelineViewed(e.target.checked)}
                className="w-5 h-5 text-green-600"
              />
              <span className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                I have read and understood the guidelines thoroughly
              </span>
            </label>
          </div>
        );

      case 2: // Checklist
        return (
          <div className="space-y-6">
            {/* Show admin-approved items for revision-required tasks */}
            {task?.status === 'revision-required' && task?.review?.approvedChecklistItems && task.review.approvedChecklistItems.length > 0 && (
              <AlertBox
                type="success"
                message={
                  <>
                    <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-green-400' : 'text-green-900'}`}>
                      Items Already Approved by Admin
                    </h4>
                    <ul className="space-y-2">
                      {checklist?.items
                        .filter(item => task.review.approvedChecklistItems.includes(item.id))
                        .map((item, idx) => (
                          <li key={item.id || idx} className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                            <Check className="text-green-600" size={16} />
                            {item.text}
                          </li>
                        ))}
                    </ul>
                  </>
                }
                icon={CheckCircle}
                isDarkMode={isDarkMode}
              />
            )}
            
            <SectionCard
              icon={ListTodo}
              title={checklist?.title || 'Checklist'}
              variant="default"
              isDarkMode={isDarkMode}
            >
              {checklist?.items && checklist.items.length > 0 ? (
                <div className="space-y-3">
                  {checklist.items.map((item, idx) => {
                    const isApproved = task?.review?.approvedChecklistItems?.includes(item.id);
                    return (
                      <ChecklistItem
                        key={item.id || idx}
                        item={item}
                        checked={checkedItems[item.id] || false}
                        onChange={() => handleChecklistToggle(item.id)}
                        showApprovedBadge={isApproved}
                        isDarkMode={isDarkMode}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No checklist available for this category.
                </p>
              )}
            </SectionCard>

            {checklist && Object.keys(checkedItems).length > 0 && (
              <AlertBox
                type={Object.values(checkedItems).every(c => c) ? 'success' : 'warning'}
                message={
                  Object.values(checkedItems).every(c => c) ? (
                    '✅ All checklist items completed!'
                  ) : (
                    `⚠️ ${Object.values(checkedItems).filter(c => !c).length} item(s) remaining`
                  )
                }
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        );

      case 3: // Worksheet
        return (
          <div className="space-y-6">
            <SectionCard
              icon={FileText}
              title={template?.name || 'Worksheet'}
              variant="purple"
              isDarkMode={isDarkMode}
            >
              {template?.description && (
                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  {template.description}
                </p>
              )}
            </SectionCard>

            {template?.fields && template.fields.length > 0 ? (
              <div className="space-y-6">
                {template.fields.map((field) => (
                  <div key={field.id}>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {renderField(field)}

                    {errors[field.id] && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors[field.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                No worksheet fields available.
              </p>
            )}
          </div>
        );

      case 4: // Final Submission
        return (
          <div className="space-y-6">
            <div className={`p-8 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-green-500' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            }`}>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-green-600' : 'bg-green-500'
                  }`}>
                    <CheckCircle className="text-white" size={48} />
                  </div>
                </div>
                
                <h3 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Ready to Submit!
                </h3>
                
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Review your submission and click the button below to complete this task.
                </p>

                {submitStatus === 'success' && (
                  <div className="mt-6 p-4 rounded-lg bg-green-100 border border-green-300">
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <p className="text-green-800 font-medium">
                        ✅ Task submitted successfully!
                      </p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mt-6 p-4 rounded-lg bg-red-100 border border-red-300">
                    <div className="flex items-center justify-center gap-3">
                      <AlertCircle className="text-red-600" size={24} />
                      <p className="text-red-800 font-medium">
                        ❌ Error submitting task. Please try again.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-slate-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Task Submission: {task?.title}
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Follow the steps below to complete your task
            </p>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                          ? 'bg-blue-600 text-white scale-110'
                          : isDarkMode
                            ? 'bg-slate-700 text-gray-400'
                            : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <Check size={24} />
                      ) : (
                        <Icon size={24} />
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${
                      isActive
                        ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        : isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowRight className={`mx-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} size={20} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } disabled:opacity-50`}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          <div className="text-sm font-medium text-gray-600">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              Next
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isSubmitting
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Task
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskSubmissionFlow;

