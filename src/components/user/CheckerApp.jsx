import React, { useState, useEffect } from 'react';
import UserSidebar from './Usersidebar';
import UserHeader from './Userheader';
import CheckerTaskList from '../worksheet/CheckerTaskList';
import TaskService from '../../services/taskService';

import { 
  MdTaskAlt, 
  MdCheckCircle,
  MdPending,
  MdFolder,
  MdNotifications,
  MdPerson
} from 'react-icons/md';

const CheckerApp = ({ 
  currentUser, 
  onLogout, 
  isDarkMode, 
  setIsDarkMode 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [assignedCategories, setAssignedCategories] = useState([]);
  const [checkerStats, setCheckerStats] = useState({
    totalTasks: 0,
    reviewedTasks: 0,
    pendingReview: 0,
    revisionRequests: 0,
    categoriesCount: 0,
    notificationsCount: 0
  });

  // Load categories and calculate stats
  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Ensure services are available globally
  useEffect(() => {
    window.TaskService = TaskService;
  }, []);

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      console.log('🔄 Tasks updated - reloading data...');
      loadData();
    };

    window.addEventListener('tasksUpdated', handleTaskUpdate);
    window.addEventListener('storage', handleTaskUpdate);

    return () => {
      window.removeEventListener('tasksUpdated', handleTaskUpdate);
      window.removeEventListener('storage', handleTaskUpdate);
    };
  }, [currentUser]);

  const loadData = () => {
    if (!currentUser) {
      console.log('No current user');
      return;
    }

    try {
      console.log('🔍 Loading data for checker:', currentUser.username, 'ID:', currentUser.id);

      // Load categories
      const allCategories = JSON.parse(
        localStorage.getItem('taskManagement_categories') || '[]'
      );
      setCategories(allCategories);

      const userId = currentUser.id;
      const userCategoryIds = currentUser.assigned_category_ids || [];

      // Filter categories assigned to this checker
      let userCategories = [];
      if (userCategoryIds.includes('all')) {
        userCategories = allCategories;
      } else {
        userCategories = allCategories.filter(cat => 
          userCategoryIds.includes(cat.id)
        );
      }
      setAssignedCategories(userCategories);

      console.log(`Found ${userCategories.length} assigned categories`);

      // Load and filter tasks for this checker
      const allTasks = TaskService.getAllTasks();
      const myTasks = allTasks.filter(task => 
        task.checkerId === userId
      );

      // Calculate stats
      const stats = {
        totalTasks: myTasks.length,
        reviewedTasks: myTasks.filter(t => t.status === 'approved').length,
        pendingReview: myTasks.filter(t => t.status === 'submitted' || t.status === 'under-review').length,
        revisionRequests: myTasks.filter(t => t.status === 'revision-required').length,
        categoriesCount: userCategories.length,
        notificationsCount: 0
      };

      setCheckerStats(stats);
      console.log('✅ Checker stats loaded:', stats);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleNavigate = (pageId, data = null) => {
    console.log('Navigating to:', pageId);
    setCurrentPage(pageId);
  };

  // Dashboard Page
  const DashboardPage = () => (
    <div className="p-6">
      {/* Welcome Section */}
      <div className={`mb-6 p-6 rounded-xl border-2 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-700' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
          } shadow-lg`}>
            <span className="text-white font-bold text-2xl">
              {currentUser?.name?.charAt(0) || currentUser?.username?.charAt(0) || 'C'}
            </span>
          </div>
          <div className="flex-1">
            <h1 className={`text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome back, {currentUser?.name || currentUser?.username || 'Checker'}!
            </h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-blue-200' : 'text-blue-800'
            }`}>
              {currentUser?.role_name || 'Checker'} • Task Review & Quality Control
            </p>
            <p className={`mt-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              You have {checkerStats.totalTasks} tasks to review across {checkerStats.categoriesCount} categories
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { 
            title: 'Total Tasks', 
            value: checkerStats.totalTasks, 
            color: 'from-blue-600 to-blue-700',
            icon: <MdTaskAlt size={32} />
          },
          { 
            title: 'Pending Review', 
            value: checkerStats.pendingReview, 
            color: 'from-orange-600 to-orange-700',
            icon: <MdPending size={32} />
          },
          { 
            title: 'Reviewed', 
            value: checkerStats.reviewedTasks, 
            color: 'from-green-600 to-green-700',
            icon: <MdCheckCircle size={32} />
          },
          { 
            title: 'Revisions Requested', 
            value: checkerStats.revisionRequests, 
            color: 'from-red-600 to-red-700',
            icon: <MdPending size={32} />
          }
        ].map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.color} p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">{card.title}</p>
              {card.icon}
            </div>
            <p className="text-4xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Categories */}
        <div className={`p-6 rounded-xl border shadow-lg ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            }`}>
              <MdFolder className="text-white" size={24} />
            </div>
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              My Categories
            </h2>
          </div>

          <div className="mb-4">
            {assignedCategories.length === 0 ? (
              <p className={`text-center py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No categories assigned
              </p>
            ) : (
              <div className="space-y-2">
                {assignedCategories.slice(0, 5).map((cat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors cursor-pointer`}
                    onClick={() => handleNavigate(`category-${cat.id}`, cat)}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`}></div>
                    <span className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {cat.name}
                    </span>
                  </div>
                ))}
                {assignedCategories.length > 5 && (
                  <p className={`text-center text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    +{assignedCategories.length - 5} more categories
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tasks Review Summary */}
        <div className={`p-6 rounded-xl border shadow-lg ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-green-600' : 'bg-green-500'
            }`}>
              <MdCheckCircle className="text-white" size={24} />
            </div>
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Review Summary
            </h2>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-orange-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-orange-900'
                }`}>
                  Awaiting Review
                </span>
                <span className={`text-2xl font-bold ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-700'
                }`}>
                  {checkerStats.pendingReview}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-orange-700'
              }`}>
                Tasks submitted by Doers
              </p>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-green-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-green-900'
                }`}>
                  Approved
                </span>
                <span className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-400' : 'text-green-700'
                }`}>
                  {checkerStats.reviewedTasks}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-green-700'
              }`}>
                Successfully reviewed
              </p>
            </div>
          </div>

          <button 
            onClick={() => handleNavigate('tasks')}
            className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Review Tasks
          </button>
        </div>
      </div>
    </div>
  );

  // Tasks Page
  const TasksPage = () => (
    <div className="p-6">
      <h2 className={`text-3xl font-bold mb-6 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Tasks to Review
      </h2>
      <CheckerTaskList
        currentChecker={currentUser}
        categories={categories}
        isDarkMode={isDarkMode}
      />
    </div>
  );

  // Profile Page
  const ProfilePage = () => (
    <div className="p-6">
      <h2 className={`text-3xl font-bold mb-6 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Profile
      </h2>
      <div className={`p-6 rounded-xl border ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start gap-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
          }`}>
            <span className="text-white font-bold text-3xl">
              {currentUser?.name?.charAt(0) || currentUser?.username?.charAt(0) || 'C'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {currentUser?.name || currentUser?.username}
            </h3>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {currentUser?.role_name || 'Checker'}
            </p>
            <p className={`text-sm mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {currentUser?.email || 'No email provided'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Notifications Page
  const NotificationsPage = () => (
    <div className="p-6">
      <h2 className={`text-3xl font-bold mb-6 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Notifications
      </h2>
      <div className={`p-6 rounded-xl border ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <p className={`text-center py-8 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          No new notifications
        </p>
      </div>
    </div>
  );

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tasks':
        return <TasksPage />;
      case 'profile':
        return <ProfilePage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <UserSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        assignedCategories={assignedCategories}
      />

      <div className="lg:ml-64">
        <UserHeader
          currentUser={currentUser}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />

        <main className="min-h-screen">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default CheckerApp;

