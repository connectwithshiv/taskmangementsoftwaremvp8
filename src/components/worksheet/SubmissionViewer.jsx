// components/worksheet/SubmissionViewer.jsx - Admin Submission Review Component

import React, { useState, useEffect } from 'react';
import { X, Eye, Download, ArrowLeft } from 'lucide-react';
import WorksheetService from '../../services/WorksheetService';

/**
 * SubmissionDetailView - Shows detailed submission data
 */
const SubmissionDetailView = ({ submission, template, onBack }) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(submission.notes || '');

  const saveNotes = () => {
    const result = WorksheetService.updateSubmission(submission.id, { notes });
    if (result.success) {
      setEditingNotes(false);
      alert('Notes saved');
    }
  };

  if (!template) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Template not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with back button */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-all duration-200"
          >
            <ArrowLeft size={18} /> Back to List
          </button>
          <h3 className="text-xl font-bold flex-1 text-gray-900">{template.name}</h3>
          <span className={`text-sm px-4 py-2 rounded-full font-semibold ${
            submission.status === 'reviewed' 
              ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
              : submission.status === 'approved'
              ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700'
              : submission.status === 'rejected'
              ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700'
              : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700'
          }`}>
            {submission.status || 'submitted'}
          </span>
        </div>

        {/* Submission metadata */}
        <div className="pt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-gray-600 font-medium">Submitted:</span>
              <p className="text-gray-900">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <span className="text-gray-600 font-medium">User ID:</span>
              <p className="text-gray-900 text-xs">{submission.userId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form data */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Submitted Data
        </h4>
        <div className="space-y-4">
          {template.fields.map((field) => {
            const value = submission.data[field.id];
            return (
              <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-2">{field.label}</p>
                <div className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                  {Array.isArray(value) ? value.join(', ') : (value || '— No data —')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Review Notes
          </h4>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-all duration-200"
            >
              Edit Notes
            </button>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              rows="4"
              placeholder="Add your review notes here..."
            />
            <div className="flex gap-2">
              <button
                onClick={saveNotes}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Save Notes
              </button>
              <button
                onClick={() => setEditingNotes(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            {notes || '— No notes added yet —'}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SubmissionListView - Shows list of submissions for a task
 */
const SubmissionListView = ({ submissions, templates, onSelectSubmission }) => {
  const getTemplateName = (templateId) => {
    const template = templates[templateId];
    return template?.name || 'Unknown Template';
  };

  return (
    <div className="space-y-2">
      {submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700">No submissions yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Users haven't submitted any worksheets for this task yet.
          </p>
        </div>
      ) : (
        submissions.map((submission) => (
          <div
            key={submission.id}
            onClick={() => onSelectSubmission(submission)}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg cursor-pointer transition-all duration-200 group hover:border-purple-300"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-2 text-base">
                  {getTemplateName(submission.templateId)}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  User ID: {submission.userId.substring(0, 30)}...
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(submission.submittedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                  submission.status === 'reviewed' 
                    ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                    : submission.status === 'approved'
                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700'
                    : submission.status === 'rejected'
                    ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700'
                    : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700'
                }`}>
                  {submission.status || 'pending'}
                </span>
                <Eye size={20} className="text-purple-500 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/**
 * SubmissionViewer - Main component for admins to review submissions
 */
const SubmissionViewer = ({ taskId, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [templates, setTemplates] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    pending: 0
  });

  // Load submissions on mount
  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = () => {
    setLoading(true);
    try {
      console.log('Loading submissions for task:', taskId);
      
      // Get submissions for this task
      const taskSubmissions = WorksheetService.getSubmissionsByTask(taskId);
      console.log('Found submissions:', taskSubmissions.length, taskSubmissions);
      setSubmissions(taskSubmissions);

      // Load templates
      const allTemplates = WorksheetService.getAllTemplates();
      console.log('Found templates:', allTemplates.length);
      const templateMap = {};
      allTemplates.forEach(t => {
        templateMap[t.id] = t;
      });
      setTemplates(templateMap);

      // Calculate stats
      setStats({
        total: taskSubmissions.length,
        reviewed: taskSubmissions.filter(s => s.status === 'reviewed').length,
        pending: taskSubmissions.filter(s => s.status !== 'reviewed').length
      });
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
    setLoading(false);
  };

  const handleStatusChange = (submissionId, newStatus) => {
    const result = WorksheetService.updateSubmission(submissionId, { status: newStatus });
    if (result.success) {
      loadData();
      alert(`Status updated to: ${newStatus}`);
    }
  };

  const handleExportSubmissions = () => {
    const data = WorksheetService.exportSubmissions();
    const filtered = {
      ...data,
      submissions: data.submissions.filter(s => s.taskId === taskId)
    };
    
    const dataStr = JSON.stringify(filtered, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submissions_${taskId}_${Date.now()}.json`;
    link.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Worksheet Submissions</h2>
            <p className="text-sm text-purple-100 mt-1.5">
              {stats.total} total • {stats.pending} pending • {stats.reviewed} reviewed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats bar */}
        {submissions.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-5 flex gap-6">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Reviewed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            </div>
            <div className="flex-1 flex items-end">
              <button
                onClick={handleExportSubmissions}
                disabled={submissions.length === 0}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {selectedSubmission ? (
            <>
              <SubmissionDetailView
                submission={selectedSubmission}
                template={templates[selectedSubmission.templateId]}
                onBack={() => setSelectedSubmission(null)}
              />

              {/* Status selector */}
              <div className="mt-6 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Update Status</label>
                <select
                  value={selectedSubmission.status || 'submitted'}
                  onChange={(e) => handleStatusChange(selectedSubmission.id, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium transition-all duration-200"
                >
                  <option value="submitted">Pending Review</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="rejected">Rejected</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </>
          ) : (
            <SubmissionListView
              submissions={submissions}
              templates={templates}
              onSelectSubmission={(submission) => {
                setSelectedSubmission(submission);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionViewer;