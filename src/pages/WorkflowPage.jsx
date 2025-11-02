import React, { useState, useEffect } from 'react';
import { GitBranch, Users, Eye, Edit, Trash2 } from 'lucide-react';
import WorkflowList from '../components/workflow/WorkflowList';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import UserDependencyBuilder from '../components/workflow/UserDependencyBuilder';
import WorkflowService from '../services/workflowService';
import UserDependencyService from '../services/userDependencyService';
import CategoryService from '../services/categoryService';
import UserService from '../services/userService';

const WorkflowPage = ({ isDarkMode = false }) => {
  const [view, setView] = useState('workflows'); // 'workflows' | 'dependencies'
  const [action, setAction] = useState(null); // null | 'create' | 'edit' | 'view'
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedDependency, setSelectedDependency] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      loadData();
      
      // Listen for updates
      const handleWorkflowUpdate = () => {
        try {
          setWorkflows(WorkflowService.getAllWorkflows());
        } catch (err) {
          console.error('Error in workflow update handler:', err);
        }
      };
      const handleDependencyUpdate = () => {
        try {
          setDependencies(UserDependencyService.getAllUserDependencies());
        } catch (err) {
          console.error('Error in dependency update handler:', err);
        }
      };
      
      window.addEventListener('workflowsUpdated', handleWorkflowUpdate);
      window.addEventListener('userDependenciesUpdated', handleDependencyUpdate);
      
      return () => {
        window.removeEventListener('workflowsUpdated', handleWorkflowUpdate);
        window.removeEventListener('userDependenciesUpdated', handleDependencyUpdate);
      };
    } catch (err) {
      console.error('Error in WorkflowPage useEffect:', err);
      setError(err.message || 'Initialization error');
    }
  }, []);

  const loadData = () => {
    console.log('📥 WorkflowPage: loadData called');
    try {
      // Load workflows
      const workflowsData = WorkflowService.getAllWorkflows();
      console.log('📋 WorkflowPage: Loaded', workflowsData?.length || 0, 'workflows');
      setWorkflows(Array.isArray(workflowsData) ? workflowsData : []);
      
      // Load dependencies
      const depsData = UserDependencyService.getAllUserDependencies();
      setDependencies(Array.isArray(depsData) ? depsData : []);
      
      // Load categories
      const categoryData = CategoryService.getAll();
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      
      // Load users - UserService is already an instance, not a class
      const usersData = UserService.getAllUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);
      
      setError(null);
    } catch (err) {
      console.error('Error loading workflow data:', err);
      setError(err.message || 'Failed to load data');
      // Set empty defaults to prevent further errors
      setWorkflows([]);
      setDependencies([]);
      setCategories([]);
      setUsers([]);
    }
  };

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setAction('create');
    setView('workflows');
  };

  const handleEditWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setAction('edit');
    setView('workflows');
  };

  const handleViewWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setAction('view');
    setView('workflows');
  };

  const handleDeleteWorkflow = (workflowId) => {
    console.log('🗑️ WorkflowPage handleDeleteWorkflow called for ID:', workflowId);
    const result = WorkflowService.deleteWorkflow(workflowId);
    console.log('✅ Delete result:', result);
    if (result.success) {
      console.log('✅ Deleting was successful, calling loadData()');
      loadData();
      alert('Workflow deleted successfully');
    } else {
      console.log('❌ Delete failed:', result.message);
      alert(result.message || 'Failed to delete workflow');
    }
  };

  const handleViewDependency = (dependency) => {
    setSelectedDependency(dependency);
    setAction('view');
    setView('dependencies');
  };

  const handleDeleteDependency = (dependencyId) => {
    const result = UserDependencyService.deleteUserDependency(dependencyId);
    if (result.success) {
      loadData();
      alert('User dependency deleted successfully');
    } else {
      alert(result.message || 'Failed to delete user dependency');
    }
  };

  const handleSaveWorkflow = (workflow) => {
    loadData();
    setAction(null);
    setSelectedWorkflow(null);
  };

  const handleCreateDependency = () => {
    setSelectedDependency(null);
    setAction('create');
    setView('dependencies');
  };

  const handleEditDependency = (dependency) => {
    setSelectedDependency(dependency);
    setAction('edit');
    setView('dependencies');
  };

  const handleSaveDependency = (dependency) => {
    loadData();
    setAction(null);
    setSelectedDependency(null);
  };

  const handleCancel = () => {
    setAction(null);
    setSelectedWorkflow(null);
    setSelectedDependency(null);
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className={`max-w-2xl mx-auto p-6 rounded-xl border-2 ${
          isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'
        }`}>
          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
            Error Loading Workflow Data
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
            {error}
          </p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render based on current view and action
  if (action === 'create' || action === 'edit' || action === 'view') {
    if (view === 'workflows') {
      return (
        <WorkflowBuilder
          workflow={selectedWorkflow}
          categories={categories}
          onSave={handleSaveWorkflow}
          onCancel={handleCancel}
          isDarkMode={isDarkMode}
          viewMode={action === 'view'}
        />
      );
    } else if (view === 'dependencies') {
      return (
        <UserDependencyBuilder
          dependency={selectedDependency}
          workflows={workflows}
          users={users}
          onSave={handleSaveDependency}
          onCancel={handleCancel}
          isDarkMode={isDarkMode}
          viewMode={action === 'view'}
        />
      );
    }
  }

  // Main view
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="p-6">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Task Dependency Management
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create and manage task dependency templates and user dependency chains
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6">
          <button
            onClick={() => {
              setView('workflows');
              setAction(null);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              view === 'workflows'
                ? isDarkMode
                  ? 'border-blue-500 text-blue-400'
                  : 'border-blue-600 text-blue-600'
                : isDarkMode
                ? 'border-transparent text-gray-400 hover:text-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <GitBranch size={20} />
            Task Dependencies ({workflows.length})
          </button>
          <button
            onClick={() => {
              setView('dependencies');
              setAction(null);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              view === 'dependencies'
                ? isDarkMode
                  ? 'border-blue-500 text-blue-400'
                  : 'border-blue-600 text-blue-600'
                : isDarkMode
                ? 'border-transparent text-gray-400 hover:text-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={20} />
            User Dependencies ({dependencies.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {view === 'workflows' ? (
          <WorkflowList
            onEdit={handleEditWorkflow}
            onView={handleViewWorkflow}
            onCreate={handleCreateWorkflow}
            onDelete={handleDeleteWorkflow}
            isDarkMode={isDarkMode}
          />
        ) : (
          <div className="p-6">
            {/* Dependencies List - Similar structure to WorkflowList */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  User Dependencies
                </h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Assign users and checkers to workflow stages
                </p>
              </div>
              <button
                onClick={handleCreateDependency}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Users size={20} />
                Create Dependency
              </button>
            </div>

            {dependencies.length === 0 ? (
              <div className={`p-12 text-center rounded-lg border-2 border-dashed ${
                isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-gray-50'
              }`}>
                <Users size={48} className={`mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  No User Dependencies Found
                </h3>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Create your first user dependency to assign users and checkers to workflow stages
                </p>
                <button
                  onClick={handleCreateDependency}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Create Dependency
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dependencies.map((dep) => {
                  const workflow = WorkflowService.getWorkflowById(dep.workflowId);
                  return (
                    <div
                      key={dep.id}
                      className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 hover:border-blue-600'
                          : 'bg-white border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${
                            isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                          }`}>
                            <Users size={20} className="text-purple-600" />
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {dep.name}
                            </h3>
                            {dep.taskCount > 0 && (
                              <span className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                Used in {dep.taskCount} task(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Workflow Info */}
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Workflow: {workflow ? workflow.name : 'Unknown'}
                      </p>

                      {/* Stage Count */}
                      <div className={`mb-4 p-3 rounded-lg ${
                        isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
                      }`}>
                        <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Stage Assignments ({dep.stageAssignments.length}):
                        </p>
                        <div className="space-y-1">
                          {dep.stageAssignments.slice(0, 3).map((stage, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                                isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {stage.stageOrder}
                              </span>
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                {stage.userName} → {stage.checkerName}
                              </span>
                            </div>
                          ))}
                          {dep.stageAssignments.length > 3 && (
                            <div className={`text-xs italic ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              +{dep.stageAssignments.length - 3} more stages
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                        <button
                          onClick={() => handleViewDependency(dep)}
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
                          onClick={() => handleEditDependency(dep)}
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
                            if (confirm(`Are you sure you want to delete "${dep.name}"? This action cannot be undone.`)) {
                              handleDeleteDependency(dep.id);
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          }`}
                          disabled={dep.taskCount > 0}
                          title={dep.taskCount > 0 ? 'Cannot delete: dependency is in use' : 'Delete dependency'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowPage;

