import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User, 
  FileText, 
  List,
  Calendar,
  TrendingUp,
  GitBranch,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import UserDependencyService from '../../services/userDependencyService';
import WorkflowService from '../../services/workflowService';
import WorksheetService from '../../services/WorksheetService';

const TaskWorkflowDetailModal = ({ task, onClose, isDarkMode = false }) => {
  const [templates, setTemplates] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  
  if (!task) return null;
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const workflow = WorkflowService.getWorkflowById(task.workflowId);
  const dependency = UserDependencyService.getUserDependencyById(task.userDependencyId);

  // Load templates on mount
  useEffect(() => {
    const allTemplates = WorksheetService.getAllTemplates();
    const templateMap = {};
    allTemplates.forEach(t => {
      templateMap[t.id] = t;
    });
    setTemplates(templateMap);
  }, []);

  // Get all stage assignments
  const getAllStageAssignments = () => {
    if (!dependency?.stageAssignments) return [];
    
    // Get completed stages from history
    const completedStages = task.stageHistory || [];
    
    // Create full stage list from workflow
    const fullStages = workflow?.categoryFlow || [];
    
    return fullStages.map((stage, idx) => {
      const stageOrder = idx + 1;
      const assignment = dependency.stageAssignments.find(s => s.stageOrder === stageOrder);
      const history = completedStages.find(h => h.stageOrder === stageOrder);
      const isCurrent = task.currentStage === stageOrder && !task.isWorkflowComplete;
      
      // Get doer's original submission - check both current stage and stage history
      let doerSubmission = null;
      if (stageOrder === task.currentStage && task.review?.submissionData) {
        // Current stage - submission is in review
        doerSubmission = task.review.submissionData;
      } else if (history?.outputData) {
        // Completed stages - outputData contains doer's submission
        doerSubmission = history.outputData;
      }
      
      return {
        stageOrder,
        categoryId: assignment?.categoryId || stage.categoryId,
        categoryName: stage.categoryName,
        userName: assignment?.userName || 'Not Assigned',
        checkerName: assignment?.checkerName || 'Not Assigned',
        status: isCurrent ? task.status : (history?.status || 'pending'),
        inputData: history?.inputData || null,
        outputData: history?.outputData || null, // This IS the doer submission for completed stages
        doerSubmission: doerSubmission, // Show for both current and completed stages
        approvedAt: history?.approvedAt || null,
        approvedBy: history?.approvedBy || null,
        isCompleted: !!history && history.status === 'approved',
        isCurrent,
        revisionCount: completedStages.filter(h => h.stageOrder === stageOrder && h.status === 'revision_requested').length
      };
    });
  };

  const stages = getAllStageAssignments();

  // Get all logs from task
  const getAllLogs = () => {
    const logs = [];
    
    // Add logs from task
    if (task.logs && Array.isArray(task.logs)) {
      logs.push(...task.logs.map(log => ({
        ...log,
        source: 'task'
      })));
    }
    
    // Add logs from review
    if (task.review) {
      if (task.review.approvedAt) {
        logs.push({
          timestamp: task.review.approvedAt,
          performedBy: task.review.approvedBy || 'Unknown',
          action: 'approved',
          details: 'Task approved by checker',
          source: 'review'
        });
      }
      if (task.review.revisionRequestedAt) {
        logs.push({
          timestamp: task.review.revisionRequestedAt,
          performedBy: task.review.revisedBy || 'Unknown',
          action: 'revision_requested',
          details: task.review.feedback || 'Revision requested',
          source: 'review'
        });
      }
    }
    
    // Add logs from stage history
    if (task.stageHistory && Array.isArray(task.stageHistory)) {
      task.stageHistory.forEach((stage, idx) => {
        if (stage.approvedAt) {
          logs.push({
            timestamp: stage.approvedAt,
            performedBy: stage.checkerName || 'Unknown',
            action: 'stage_approved',
            details: `Stage ${stage.stageOrder} (${stage.categoryName}) approved`,
            source: 'stage_history',
            stageOrder: stage.stageOrder
          });
        }
      });
    }
    
    // Sort by timestamp (newest first)
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const allLogs = getAllLogs();

  // Get total revisions
  const getTotalRevisions = () => {
    let count = 0;
    
    // Count from stage history
    if (task.stageHistory) {
      count += task.stageHistory.filter(s => s.status === 'revision_requested').length;
    }
    
    // Count from current stage if applicable
    if (task.review?.revisionRequestedAt) {
      const currentStageHistory = task.stageHistory?.filter(s => s.stageOrder === task.currentStage);
      const revisionCounts = currentStageHistory?.filter(s => s.status === 'revision_requested').length || 0;
      count += revisionCounts;
    }
    
    return count;
  };

  const totalRevisions = getTotalRevisions();

  // Render submission data in a formatted way
  const renderSubmissionData = (submissionData, templateId) => {
    if (!submissionData) return null;
    
    // Get template
    const template = templates[templateId];
    
    // If we have template and structured data, render fields
    if (template && template.fields && submissionData.data) {
      return (
        <div className="space-y-2">
          {template.fields.map((field) => {
            const value = submissionData.data[field.id];
            return (
              <div key={field.id} className="border border-gray-300 rounded p-2 bg-white">
                <p className="text-xs font-semibold text-gray-700 mb-1">{field.label}</p>
                <div className="text-xs text-gray-900">
                  {Array.isArray(value) ? value.join(', ') : (value || '— No data —')}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Otherwise render as JSON
    return (
      <div className={`p-2 rounded text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto ${
        isDarkMode ? 'bg-slate-900 text-gray-300' : 'bg-white text-gray-800'
      }`}>
        {typeof submissionData === 'string' 
          ? submissionData 
          : JSON.stringify(submissionData, null, 2)}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {task.title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isDarkMode 
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {workflow?.name || 'Unknown Workflow'}
              </span>
              {dependency && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDarkMode 
                    ? 'bg-purple-900/30 text-purple-300 border border-purple-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {dependency.name}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                task.isWorkflowComplete
                  ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                  : isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {task.isWorkflowComplete ? 'Complete' : `Stage ${task.currentStage} / ${stages.length}`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stage Details */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Stage Details
              </h3>
            </div>
            
            <div className="space-y-3">
              {stages.map((stage, idx) => (
                <div
                  key={stage.stageOrder}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    stage.isCurrent
                      ? isDarkMode
                        ? 'border-blue-600 bg-blue-900/10'
                        : 'border-blue-500 bg-blue-50'
                      : stage.isCompleted
                      ? isDarkMode
                        ? 'border-green-600 bg-green-900/10'
                        : 'border-green-500 bg-green-50'
                      : isDarkMode
                        ? 'border-slate-700 bg-slate-800/50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-semibold ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Stage {stage.stageOrder}
                        </span>
                        <span className={`text-base font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {stage.categoryName}
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          stage.isCompleted
                            ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                            : stage.isCurrent
                            ? isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                            : isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {stage.isCompleted ? 'Completed' : stage.isCurrent ? 'Current' : 'Pending'}
                        </span>
                        
                        {stage.revisionCount > 0 && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <AlertCircle size={12} />
                            {stage.revisionCount} revision{stage.revisionCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User & Checker */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className={`p-3 rounded-lg ${
                      isDarkMode ? 'bg-slate-700/50' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Assigned User
                        </span>
                      </div>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stage.userName}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      isDarkMode ? 'bg-slate-700/50' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Checker
                        </span>
                      </div>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stage.checkerName}
                      </p>
                    </div>
                  </div>

                  {/* Completion Info */}
                  {stage.approvedAt && (
                    <div className={`mt-3 pt-3 border-t ${
                      isDarkMode ? 'border-slate-600' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>
                          Approved on {new Date(stage.approvedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} by {stage.checkerName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submissions - Accordion Style */}
                  {(stage.doerSubmission || stage.outputData || stage.inputData) && (
                    <div className={`mt-3 pt-3 border-t ${
                      isDarkMode ? 'border-slate-600' : 'border-gray-200'
                    }`}>
                      <div className="space-y-2">
                        {/* Doer Submission Accordion - Show for all stages with submission */}
                        {stage.doerSubmission && (
                          <div className={`rounded-lg border-2 overflow-hidden ${
                            stage.isCurrent
                              ? isDarkMode ? 'bg-blue-900/10 border-blue-700' : 'bg-blue-50 border-blue-200'
                              : isDarkMode ? 'bg-blue-900/10 border-blue-700' : 'bg-blue-50 border-blue-200'
                          }`}>
                            <button
                              onClick={() => toggleSection(`doer-${stage.stageOrder}`)}
                              className="w-full flex items-center justify-between p-3 hover:opacity-80 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                <User size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                  Doer Submission {stage.isCurrent ? '(Pending Review)' : '(Approved)'}
                                </span>
                              </div>
                              {expandedSections[`doer-${stage.stageOrder}`] ? (
                                <ChevronUp size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                              ) : (
                                <ChevronDown size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                              )}
                            </button>
                            {expandedSections[`doer-${stage.stageOrder}`] && (
                              <div className={`p-4 border-t ${
                                isDarkMode ? 'border-blue-800 bg-slate-800/50' : 'border-blue-200 bg-white'
                              }`}>
                                <div className="max-h-96 overflow-y-auto">
                                  {renderSubmissionData(stage.doerSubmission, stage.doerSubmission?.templateId)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Checker Approved Accordion - Show for completed stages */}
                        {stage.outputData && stage.isCompleted && (
                          <div className={`rounded-lg border-2 overflow-hidden ${
                            isDarkMode ? 'bg-green-900/10 border-green-700' : 'bg-green-50 border-green-200'
                          }`}>
                            <button
                              onClick={() => toggleSection(`approved-${stage.stageOrder}`)}
                              className="w-full flex items-center justify-between p-3 hover:opacity-80 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle size={16} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                                  Checker Approved
                                </span>
                              </div>
                              {expandedSections[`approved-${stage.stageOrder}`] ? (
                                <ChevronUp size={16} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                              ) : (
                                <ChevronDown size={16} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                              )}
                            </button>
                            {expandedSections[`approved-${stage.stageOrder}`] && (
                              <div className={`p-4 border-t ${
                                isDarkMode ? 'border-green-800 bg-slate-800/50' : 'border-green-200 bg-white'
                              }`}>
                                <div className="max-h-96 overflow-y-auto">
                                  {renderSubmissionData(stage.outputData, stage.outputData?.templateId)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Input from Previous Stage Accordion */}
                        {stage.inputData && (stage.doerSubmission || stage.outputData) && (
                          <div className={`rounded-lg border-2 overflow-hidden ${
                            isDarkMode ? 'bg-gray-900/20 border-gray-600' : 'bg-gray-100 border-gray-300'
                          }`}>
                            <button
                              onClick={() => toggleSection(`input-${stage.stageOrder}`)}
                              className="w-full flex items-center justify-between p-3 hover:opacity-80 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                <GitBranch size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Input from Previous Stage
                                </span>
                              </div>
                              {expandedSections[`input-${stage.stageOrder}`] ? (
                                <ChevronUp size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                              ) : (
                                <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                              )}
                            </button>
                            {expandedSections[`input-${stage.stageOrder}`] && (
                              <div className={`p-4 border-t ${
                                isDarkMode ? 'border-gray-700 bg-slate-800/50' : 'border-gray-300 bg-white'
                              }`}>
                                <div className="max-h-96 overflow-y-auto">
                                  {renderSubmissionData(stage.inputData, stage.inputData?.templateId)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Revisions Summary */}
          {totalRevisions > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-amber-500" />
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Revision Summary
                </h3>
              </div>
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-amber-900/20 border border-amber-700' : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                  Total revisions across all stages: <strong>{totalRevisions}</strong>
                </p>
                {task.review?.feedback && (
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Latest feedback: {task.review.feedback}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Complete Logs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <List size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Complete Activity Log
              </h3>
            </div>
            
            {allLogs.length === 0 ? (
              <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
                isDarkMode ? 'border-slate-700' : 'border-gray-300'
              }`}>
                <FileText size={32} className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  No activity logs available
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {allLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      log.action === 'approved' || log.action === 'stage_approved'
                        ? isDarkMode 
                          ? 'bg-green-900/10 border-green-600' 
                          : 'bg-green-50 border-green-500'
                        : log.action === 'revision_requested'
                        ? isDarkMode 
                          ? 'bg-amber-900/10 border-amber-600' 
                          : 'bg-amber-50 border-amber-500'
                        : isDarkMode
                          ? 'bg-slate-800/50 border-slate-600'
                          : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.action === 'approved' || log.action === 'stage_approved' ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : log.action === 'revision_requested' ? (
                          <AlertCircle size={16} className="text-amber-600" />
                        ) : (
                          <FileText size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        )}
                        <span className={`text-sm font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(log.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {log.details}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      By: {log.performedBy}
                      {log.stageOrder && ` | Stage: ${log.stageOrder}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end gap-3 ${
          isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskWorkflowDetailModal;

