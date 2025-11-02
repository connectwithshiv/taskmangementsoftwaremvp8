import React, { useState, useMemo } from 'react';
import { 
  GitBranch, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  Users,
  Filter
} from 'lucide-react';
import TaskService from '../../services/taskService';
import WorkflowService from '../../services/workflowService';
import UserDependencyService from '../../services/userDependencyService';
import TaskWorkflowDetailModal from './TaskWorkflowDetailModal';

const TaskWorkflowView = ({ tasks = [], categories = [], users = [], isDarkMode = false }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState('all');
  const [selectedDependency, setSelectedDependency] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedTask, setSelectedTask] = useState(null);

  // Get all workflows
  const workflows = useMemo(() => {
    return WorkflowService.getAllWorkflows();
  }, []);

  // Get all user dependencies
  const dependencies = useMemo(() => {
    return UserDependencyService.getAllUserDependencies();
  }, []);

  // Filter workflow tasks
  const workflowTasks = useMemo(() => {
    let filtered = tasks.filter(task => task.workflowId);
    
    if (selectedWorkflow !== 'all') {
      filtered = filtered.filter(task => task.workflowId === selectedWorkflow);
    }
    
    if (selectedDependency !== 'all') {
      filtered = filtered.filter(task => task.userDependencyId === selectedDependency);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }
    
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === selectedTeam);
    }
    
    if (dateRange.from) {
      filtered = filtered.filter(task => 
        new Date(task.createdAt) >= new Date(dateRange.from)
      );
    }
    
    if (dateRange.to) {
      filtered = filtered.filter(task => 
        new Date(task.createdAt) <= new Date(dateRange.to)
      );
    }
    
    return filtered;
  }, [tasks, selectedWorkflow, selectedDependency, selectedTeam, selectedStatus, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = workflowTasks.length;
    const completed = workflowTasks.filter(t => t.isWorkflowComplete || t.status === 'completed').length;
    const inProgress = workflowTasks.filter(t => 
      !t.isWorkflowComplete && ['pending', 'in-progress', 'submitted', 'under-review', 'revision-required'].includes(t.status)
    ).length;
    const stuck = workflowTasks.filter(t => 
      t.revisedCount >= 3 || 
      (t.status === 'revision-required' && t.revisedCount >= 2)
    ).length;

    // Average time per stage
    const completedTasks = workflowTasks.filter(t => t.isWorkflowComplete && t.stageHistory);
    let totalStageTime = 0;
    let stageCount = 0;
    
    completedTasks.forEach(task => {
      task.stageHistory?.forEach((stage, idx) => {
        if (idx > 0) {
          const prevStage = task.stageHistory[idx - 1];
          const timeDiff = new Date(stage.approvedAt) - new Date(prevStage.approvedAt);
          totalStageTime += timeDiff;
          stageCount++;
        }
      });
    });
    
    const avgStageTime = stageCount > 0 ? Math.round(totalStageTime / stageCount / (1000 * 60 * 60)) : 0; // hours

    return {
      total,
      completed,
      inProgress,
      stuck,
      avgStageTime,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [workflowTasks]);

  // Get workflow by ID
  const getWorkflowById = (workflowId) => {
    return workflows.find(w => w.id === workflowId);
  };

  // Get dependency by ID
  const getDependencyById = (depId) => {
    return dependencies.find(d => d.id === depId);
  };

  // Format duration
  const formatDuration = (hours) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const hrs = hours % 24;
    return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
  };

  // Render task card with workflow details
  const renderTaskCard = (task) => {
    const workflow = getWorkflowById(task.workflowId);
    const dependency = getDependencyById(task.userDependencyId);
    const currentStageAssignment = dependency?.stageAssignments?.find(
      s => s.stageOrder === task.currentStage
    );

    return (
      <div
        key={task.id}
        className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg cursor-pointer ${
          isDarkMode
            ? 'bg-slate-800 border-slate-700 hover:border-blue-600'
            : 'bg-white border-gray-200 hover:border-blue-400'
        }`}
        onClick={() => setSelectedTask(task)}
      >
        {/* Task Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isDarkMode 
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {workflow?.name || 'Unknown Workflow'}
              </span>
              {dependency && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isDarkMode 
                    ? 'bg-purple-900/30 text-purple-300 border border-purple-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {dependency.name}
                </span>
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
            task.isWorkflowComplete
              ? isDarkMode 
                ? 'bg-green-900/30 text-green-300' 
                : 'bg-green-100 text-green-700'
              : isDarkMode 
                ? 'bg-yellow-900/30 text-yellow-300' 
                : 'bg-yellow-100 text-yellow-700'
          }`}>
            {task.isWorkflowComplete ? 'Complete' : `Stage ${task.currentStage}`}
          </div>
        </div>

        {/* Progress Timeline */}
        {task.stageHistory && task.stageHistory.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 text-xs mb-2">
              <TrendingUp size={14} />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                Progress: {task.stageHistory.length} / {workflow?.categoryFlow?.length || '?'} stages
              </span>
            </div>
            <div className="flex items-center gap-1">
              {workflow?.categoryFlow?.slice(0, 5).map((stage, idx) => {
                const isCompleted = task.stageHistory?.some(
                  s => s.stageOrder === stage.order && s.status === 'approved'
                );
                const isCurrent = task.currentStage === stage.order && !task.isWorkflowComplete;
                
                return (
                  <div
                    key={idx}
                    className={`flex-1 h-2 rounded-full ${
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? 'bg-yellow-500 animate-pulse'
                        : isDarkMode
                        ? 'bg-slate-600'
                        : 'bg-gray-300'
                    }`}
                  />
                );
              })}
              {workflow?.categoryFlow?.length > 5 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{workflow.categoryFlow.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current Stage Info */}
        {currentStageAssignment && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                {currentStageAssignment.userName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                {currentStageAssignment.checkerName}
              </span>
            </div>
          </div>
        )}

        {/* Task Meta */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={12} />
            <span>
              {new Date(task.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
          {task.revisedCount > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${
              isDarkMode 
                ? 'bg-amber-900/30 text-amber-300' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              <AlertCircle size={12} />
              <span>{task.revisedCount} revision{task.revisedCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <span className={`text-xs font-medium ${
            task.status === 'completed' || task.isWorkflowComplete
              ? 'text-green-600'
              : ['submitted', 'under-review'].includes(task.status)
              ? 'text-blue-600'
              : task.status === 'revision-required'
              ? 'text-orange-600'
              : 'text-gray-600'
          }`}>
            {task.status === 'completed' || task.isWorkflowComplete 
              ? 'Workflow Complete' 
              : task.status === 'submitted'
              ? 'Submitted for Review'
              : task.status === 'under-review'
              ? 'Under Review'
              : task.status === 'revision-required'
              ? 'Revision Required'
              : task.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className={`mb-6 p-5 rounded-xl border-2 ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <GitBranch size={24} />
          Task Dependency Analytics
        </h2>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Total Tasks
              </span>
              <GitBranch size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.total}
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                Completed
              </span>
              <CheckCircle size={18} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.completed}
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
              {stats.completionRate}% rate
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                In Progress
              </span>
              <Clock size={18} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.inProgress}
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                Stuck Tasks
              </span>
              <AlertCircle size={18} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.stuck}
            </p>
            {stats.avgStageTime > 0 && (
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                Avg: {formatDuration(stats.avgStageTime)}/stage
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`mb-6 p-5 rounded-xl border-2 ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Filters
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Workflow Filter */}
          <div>
            <label className={`block text-xs font-medium mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Task Dependency
            </label>
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Task Dependencies</option>
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Dependency Filter */}
          <div>
            <label className={`block text-xs font-medium mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              User Dependency
            </label>
            <select
              value={selectedDependency}
              onChange={(e) => setSelectedDependency(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All User Dependencies</option>
              {dependencies
                .filter(dep => !selectedWorkflow || dep.workflowId === selectedWorkflow)
                .map(dep => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Team/User Filter */}
          <div>
            <label className={`block text-xs font-medium mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Current Assignee
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Users</option>
              {users
                .filter(u => u.status === 'active')
                .map(user => (
                  <option key={user.id || user.user_id} value={user.id || user.user_id}>
                    {user.name || user.username || user.email}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className={`block text-xs font-medium mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="revision-required">Revision Required</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className={`block text-xs font-medium mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Date To */}
          <div>
            <label className={`block text-xs font-medium mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSelectedWorkflow('all');
              setSelectedDependency('all');
              setSelectedTeam('all');
              setSelectedStatus('all');
              setDateRange({ from: '', to: '' });
            }}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Task Dependency Tasks ({workflowTasks.length})
        </h3>
      </div>

      {workflowTasks.length === 0 ? (
        <div className={`p-12 text-center rounded-lg border-2 border-dashed ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <GitBranch size={48} className={`mx-auto mb-4 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-lg font-semibold mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            No Workflow Tasks Found
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            {selectedWorkflow !== 'all' || selectedDependency !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Tasks created with task dependencies will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflowTasks.map(renderTaskCard)}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskWorkflowDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default TaskWorkflowView;

