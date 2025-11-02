import { StorageService } from "./storageService";
import { UserIdResolver } from "../components/user/UserIdResolver";
import UserDependencyService from "./userDependencyService";
import WorkflowService from "./workflowService";

// Task statuses
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  SUBMITTED: 'submitted', // Submitted for review
  UNDER_REVIEW: 'under-review', // Admin is reviewing
  APPROVED: 'approved', // Admin approved
  REVISION_REQUIRED: 'revision-required' // Admin requires corrections
};

// Task priorities
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Initialize tasks from localStorage
let tasks = [];

const loadTasks = () => {
  try {
    const data = StorageService.loadTasks();
    tasks = data.tasks || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasks = [];
  }
};

const saveTasks = () => {
  try {
    StorageService.saveTasks({ tasks });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tasksUpdated'));
      console.log(' Tasks saved and event fired');
    }
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

loadTasks();

const TaskService = {
  // Get all tasks
  getAllTasks: () => {
    loadTasks();
    return tasks;
  },

  // Get task by ID
  getTaskById: (taskId) => {
    return tasks.find(task => task.id === taskId);
  },

  // Create new task
  createTask: (taskData) => {
    try {
      const now = new Date().toISOString();
      
      if (!taskData.assignedToName && taskData.assignedTo) {
        console.warn('assignedToName missing for task creation. assignedTo:', taskData.assignedTo);
      }
      
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: taskData.title,
        description: taskData.description || '',
        categoryId: taskData.categoryId,
        categoryPath: taskData.categoryPath || '',
        assignedTo: taskData.assignedTo, // Keep whatever ID format is provided
        assignedToName: taskData.assignedToName || '',
        checkerId: taskData.checkerId || null,
        checkerName: taskData.checkerName || '',
        priority: taskData.priority || TASK_PRIORITY.MEDIUM,
        status: taskData.status || TASK_STATUS.PENDING,
        dueDate: taskData.dueDate || null,
        startDate: taskData.startDate || null,
        completedDate: null,
        estimatedHours: taskData.estimatedHours || null,
        actualHours: taskData.actualHours || null,
        tags: taskData.tags || [],
        attachments: taskData.attachments || [],
        comments: taskData.comments || [],
        // Worksheet fields
        hasWorksheet: taskData.hasWorksheet || false,
        worksheetTemplateId: taskData.worksheetTemplateId || null,
        worksheetSubmissions: [],
        // Review and approval fields
        review: null, // Stores review data
        approvedBy: null,
        approvedAt: null,
        revisedCount: 0,
        // Workflow fields
        workflowId: taskData.workflowId || null,
        workflowName: taskData.workflowName || null,
        userDependencyId: taskData.userDependencyId || null,
        userDependencyName: taskData.userDependencyName || null,
        currentStage: taskData.currentStage !== undefined ? taskData.currentStage : 0,
        stageHistory: taskData.stageHistory || [],
        isWorkflowComplete: false,
        createdAt: now,
        updatedAt: now,
        createdBy: taskData.createdBy || 'system',
        updatedBy: taskData.createdBy || 'system',
        logs: [{
          action: 'created',
          timestamp: now,
          performedBy: taskData.createdBy || 'system',
          details: `Task created${taskData.hasWorksheet ? ' with worksheet template' : ''}${taskData.workflowId ? ' with workflow' : ''}`
        }]
      };

      // If workflow task, initialize stage history
      if (newTask.workflowId && newTask.userDependencyId && newTask.currentStage === 0) {
        // Get first stage assignment
        const firstStage = UserDependencyService.getStageAssignment(newTask.userDependencyId, 1);
        if (firstStage) {
          newTask.currentStage = 1;
          newTask.categoryId = firstStage.categoryId;
          newTask.categoryPath = firstStage.categoryName;
          newTask.assignedTo = firstStage.userId;
          newTask.assignedToName = firstStage.userName;
          newTask.checkerId = firstStage.checkerId;
          newTask.checkerName = firstStage.checkerName;
          
          // Initialize stage history
          newTask.stageHistory = [];
          
          // Increment dependency usage
          UserDependencyService.incrementTaskCount(newTask.userDependencyId);
          
          // Increment workflow usage
          WorkflowService.incrementTaskCount(newTask.workflowId);
        }
      }
      
      tasks.push(newTask);
      saveTasks();
      
      console.log(' Task created:', {
        title: newTask.title,
        assignedTo: newTask.assignedTo,
        assignedToName: newTask.assignedToName,
        checkerId: newTask.checkerId,
        checkerName: newTask.checkerName,
        hasWorksheet: newTask.hasWorksheet,
        worksheetTemplateId: newTask.worksheetTemplateId,
        workflowId: newTask.workflowId,
        currentStage: newTask.currentStage
      });
      
      return { 
        success: true, 
        task: newTask,
        message: 'Task created successfully' 
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Update task
  updateTask: (taskId, updateData) => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { 
          success: false, 
          message: 'Task not found' 
        };
      }

      const now = new Date().toISOString();
      const oldTask = tasks[taskIndex];
      
      const finalUpdateData = { ...updateData };
      if (finalUpdateData.assignedTo && !finalUpdateData.assignedToName) {
        finalUpdateData.assignedToName = oldTask.assignedToName || '';
      }
      
      const updatedTask = {
        ...oldTask,
        ...finalUpdateData,
        id: taskId,
        // Preserve worksheet fields if not updating them
        hasWorksheet: finalUpdateData.hasWorksheet !== undefined 
          ? finalUpdateData.hasWorksheet 
          : oldTask.hasWorksheet,
        worksheetTemplateId: finalUpdateData.worksheetTemplateId !== undefined 
          ? finalUpdateData.worksheetTemplateId 
          : oldTask.worksheetTemplateId,
        worksheetSubmissions: finalUpdateData.worksheetSubmissions || oldTask.worksheetSubmissions || [],
        updatedAt: now,
        updatedBy: updateData.updatedBy || 'system',
        logs: [
          ...(oldTask.logs || []),
          {
            action: 'updated',
            timestamp: now,
            performedBy: updateData.updatedBy || 'system',
            details: 'Task information updated'
          }
        ]
      };

      tasks[taskIndex] = updatedTask;
      saveTasks();
      
      return { 
        success: true, 
        task: updatedTask,
        message: 'Task updated successfully' 
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Delete task
  deleteTask: (taskId, deletedBy = 'system') => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { 
          success: false, 
          message: 'Task not found' 
        };
      }

      tasks.splice(taskIndex, 1);
      saveTasks();
      
      return { 
        success: true, 
        message: 'Task deleted successfully' 
      };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Update task status
  updateTaskStatus: (taskId, status, updatedBy = 'system') => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { 
          success: false, 
          message: 'Task not found' 
        };
      }

      const now = new Date().toISOString();
      const task = tasks[taskIndex];
      const oldStatus = task.status;
      
      tasks[taskIndex] = {
        ...task,
        status: status,
        updatedAt: now,
        updatedBy: updatedBy,
        startDate: status === TASK_STATUS.IN_PROGRESS && !task.startDate ? now : task.startDate,
        completedDate: status === TASK_STATUS.COMPLETED ? now : task.completedDate,
        logs: [
          ...(task.logs || []),
          {
            action: 'status_changed',
            timestamp: now,
            performedBy: updatedBy,
            details: `Status changed from ${oldStatus} to ${status}`
          }
        ]
      };

      saveTasks();
      
      return { 
        success: true, 
        task: tasks[taskIndex],
        message: 'Task status updated successfully' 
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  //  Search and filter tasks (with ID resolver)
  searchTasks: (searchTerm = '', filters = {}) => {
    let filteredTasks = [...tasks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        task.categoryPath.toLowerCase().includes(term) ||
        task.assignedToName.toLowerCase().includes(term) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    if (filters.status && filters.status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.categoryId === filters.categoryId);
    }

    //  Filter by user with ID resolver
    if (filters.assignedTo && filters.assignedTo !== 'all') {
      const searchId = String(filters.assignedTo);
      filteredTasks = filteredTasks.filter(task => String(task.assignedTo) === searchId);
    }

    // Filter by workflow
    if (filters.workflowId && filters.workflowId !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.workflowId === filters.workflowId);
    }

    // Filter by dependency
    if (filters.dependencyId && filters.dependencyId !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.userDependencyId === filters.dependencyId);
    }

    // Filter by creation date
    if (filters.dateFrom) {
      filteredTasks = filteredTasks.filter(task => 
        task.createdAt && new Date(task.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filteredTasks = filteredTasks.filter(task => 
        task.createdAt && new Date(task.createdAt) <= new Date(filters.dateTo)
      );
    }

    if (filters.dueDateFrom) {
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) >= new Date(filters.dueDateFrom)
      );
    }

    if (filters.dueDateTo) {
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) <= new Date(filters.dueDateTo)
      );
    }

    return filteredTasks;
  },

  // Sort tasks
  sortTasks: (tasksToSort, sortBy, sortOrder = 'asc') => {
    return [...tasksToSort].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'updatedAt':
          comparison = new Date(b.updatedAt) - new Date(a.updatedAt);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  },

  // Get task statistics
  getStatistics: () => {
    const stats = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
        inProgress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
        completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
        cancelled: tasks.filter(t => t.status === TASK_STATUS.CANCELLED).length
      },
      byPriority: {
        urgent: tasks.filter(t => t.priority === TASK_PRIORITY.URGENT).length,
        high: tasks.filter(t => t.priority === TASK_PRIORITY.HIGH).length,
        medium: tasks.filter(t => t.priority === TASK_PRIORITY.MEDIUM).length,
        low: tasks.filter(t => t.priority === TASK_PRIORITY.LOW).length
      },
      overdue: tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < new Date() && 
        t.status !== TASK_STATUS.COMPLETED
      ).length,
      dueToday: tasks.filter(t => {
        if (!t.dueDate) return false;
        const today = new Date().toDateString();
        return new Date(t.dueDate).toDateString() === today;
      }).length,
      completionRate: tasks.length > 0 
        ? ((tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length / tasks.length) * 100).toFixed(1)
        : 0
    };

    return stats;
  },

  //  Get tasks by user (with ID resolver)
  getTasksByUser: (user) => {
    if (!user) return [];
    
    return tasks.filter(task => UserIdResolver.isTaskAssignedToUser(task, user));
  },

  // Get tasks by category
  getTasksByCategory: (categoryId) => {
    return tasks.filter(task => task.categoryId === categoryId);
  },

  // Get overdue tasks
  getOverdueTasks: () => {
    const now = new Date();
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== TASK_STATUS.COMPLETED &&
      task.status !== TASK_STATUS.CANCELLED
    );
  },

  // Get upcoming tasks
  getUpcomingTasks: (days = 7) => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && 
             dueDate <= future && 
             task.status !== TASK_STATUS.COMPLETED &&
             task.status !== TASK_STATUS.CANCELLED;
    });
  },

  // Add comment
  addComment: (taskId, comment, userId = 'system') => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { success: false, message: 'Task not found' };
      }

      const now = new Date().toISOString();
      const newComment = {
        id: `comment_${Date.now()}`,
        text: comment,
        userId: userId,
        timestamp: now
      };

      tasks[taskIndex].comments = [...(tasks[taskIndex].comments || []), newComment];
      tasks[taskIndex].updatedAt = now;
      
      saveTasks();
      
      return { success: true, comment: newComment };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Add attachment
  addAttachment: (taskId, attachment) => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { success: false, message: 'Task not found' };
      }

      const now = new Date().toISOString();
      const newAttachment = {
        id: `attachment_${Date.now()}`,
        ...attachment,
        uploadedAt: now
      };

      tasks[taskIndex].attachments = [...(tasks[taskIndex].attachments || []), newAttachment];
      tasks[taskIndex].updatedAt = now;
      
      saveTasks();
      
      return { success: true, attachment: newAttachment };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Bulk update status
  bulkUpdateStatus: (taskIds, status, updatedBy = 'system') => {
    try {
      const now = new Date().toISOString();
      let updatedCount = 0;

      taskIds.forEach(taskId => {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          tasks[taskIndex].status = status;
          tasks[taskIndex].updatedAt = now;
          tasks[taskIndex].updatedBy = updatedBy;
          updatedCount++;
        }
      });

      saveTasks();
      
      return { 
        success: true, 
        message: `${updatedCount} tasks updated successfully` 
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Bulk delete
  bulkDelete: (taskIds) => {
    try {
      tasks = tasks.filter(t => !taskIds.includes(t.id));
      saveTasks();
      
      return { 
        success: true, 
        message: `${taskIds.length} tasks deleted successfully` 
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Clear all tasks
  clearAllTasks: () => {
    tasks = [];
    saveTasks();
  },

  // Export tasks
  exportTasks: () => {
    return {
      tasks: tasks,
      exportedAt: new Date().toISOString()
    };
  },

  // Import tasks
  importTasks: (importedTasks) => {
    tasks = importedTasks;
    saveTasks();
  },

  // Worksheet-related methods
  
  /**
   * Add worksheet submission ID to task
   */
  addWorksheetSubmission: (taskId, submissionId) => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { success: false, message: 'Task not found' };
      }

      const task = tasks[taskIndex];
      
      // Add submission ID if not already present
      if (!task.worksheetSubmissions) {
        task.worksheetSubmissions = [];
      }
      
      if (!task.worksheetSubmissions.includes(submissionId)) {
        task.worksheetSubmissions.push(submissionId);
        task.updatedAt = new Date().toISOString();
        
        saveTasks();
        
        console.log('✅ Worksheet submission added to task:', submissionId);
      }
      
      return { success: true, message: 'Submission added' };
    } catch (error) {
      console.error('Error adding worksheet submission:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get tasks with worksheets
   */
  getTasksWithWorksheets: () => {
    return tasks.filter(t => t.hasWorksheet === true && t.worksheetTemplateId);
  },

  /**
   * Get tasks without worksheets
   */
  getTasksWithoutWorksheets: () => {
    return tasks.filter(t => !t.hasWorksheet || !t.worksheetTemplateId);
  },

  /**
   * Get task worksheet info
   */
  getTaskWorksheetInfo: (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return null;
    }
    
    return {
      taskId: task.id,
      taskTitle: task.title,
      hasWorksheet: task.hasWorksheet,
      worksheetTemplateId: task.worksheetTemplateId,
      submissionCount: task.worksheetSubmissions?.length || 0,
      submissions: task.worksheetSubmissions || []
    };
  },

  /**
   * Check if task has worksheet template
   */
  hasWorksheetTemplate: (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task && task.hasWorksheet && task.worksheetTemplateId;
  },

  /**
   * Get worksheet submission IDs for task
   */
  getWorksheetSubmissions: (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.worksheetSubmissions || [];
  },

  /**
   * Get tasks that are submitted for review
   */
  getSubmittedTasks: () => {
    return tasks.filter(t => t.status === TASK_STATUS.SUBMITTED || t.status === TASK_STATUS.UNDER_REVIEW);
  },

  /**
   * Submit task for review (user action)
   */
  submitTaskForReview: (taskId, submissionData, userId) => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { success: false, message: 'Task not found' };
      }

      const now = new Date().toISOString();
      const task = tasks[taskIndex];
      
      tasks[taskIndex] = {
        ...task,
        status: TASK_STATUS.SUBMITTED,
        updatedAt: now,
        updatedBy: userId,
        // Store submission data
        review: {
          submissionData: submissionData,
          submittedAt: now,
          submittedBy: userId
        },
        logs: [
          ...(task.logs || []),
          {
            action: 'submitted_for_review',
            timestamp: now,
            performedBy: userId,
            details: 'Task submitted for admin review'
          }
        ]
      };

      saveTasks();
      
      return { 
        success: true, 
        task: tasks[taskIndex],
        message: 'Task submitted for review successfully' 
      };
    } catch (error) {
      console.error('Error submitting task for review:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Admin reviews and approves task
   * Handles workflow handoff if task is part of a workflow
   */
  approveTask: (taskId, adminId, adminFeedback = null, outputData = null) => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { success: false, message: 'Task not found' };
      }

      const now = new Date().toISOString();
      const task = tasks[taskIndex];
      
      // Check if task is part of a workflow
      if (task.workflowId && task.userDependencyId) {
        // Get current stage assignment
        const currentStageAssignment = UserDependencyService.getStageAssignment(
          task.userDependencyId,
          task.currentStage
        );
        
        // Save current stage output
        const currentStageHistory = {
          stageOrder: task.currentStage,
          categoryId: task.categoryId,
          categoryName: task.categoryPath.split(' > ').pop() || '',
          userId: task.assignedTo,
          userName: task.assignedToName,
          checkerId: adminId,
          checkerName: currentStageAssignment?.checkerName || '',
          status: 'approved',
          inputData: task.stageHistory.length > 0 
            ? task.stageHistory[task.stageHistory.length - 1].outputData 
            : null,
          outputData: outputData || task.review?.submissionData || null,
          approvedAt: now,
          approvedBy: adminId
        };
        
        const updatedStageHistory = [...(task.stageHistory || []), currentStageHistory];
        
        // Check if this is the last stage
        const isLastStage = UserDependencyService.isLastStage(
          task.userDependencyId,
          task.currentStage
        );
        
        if (isLastStage) {
          // Mark workflow as complete
          tasks[taskIndex] = {
            ...task,
            status: TASK_STATUS.COMPLETED,
            updatedAt: now,
            updatedBy: adminId,
            approvedBy: adminId,
            approvedAt: now,
            completedDate: now,
            isWorkflowComplete: true,
            currentStage: task.currentStage,
            stageHistory: updatedStageHistory,
            review: {
              ...task.review,
              reviewedAt: now,
              reviewedBy: adminId,
              approved: true,
              adminFeedback: adminFeedback
            },
            logs: [
              ...(task.logs || []),
              {
                action: 'workflow_completed',
                timestamp: now,
                performedBy: adminId,
                details: `Workflow completed at stage ${task.currentStage}`
              }
            ]
          };
          
          saveTasks();
          
          return { 
            success: true, 
            task: tasks[taskIndex],
            message: 'Workflow completed successfully',
            isWorkflowComplete: true
          };
        } else {
          // Move to next stage
          const nextStage = UserDependencyService.getNextStage(
            task.userDependencyId,
            task.currentStage
          );
          
          if (!nextStage) {
            return { 
              success: false, 
              message: 'Next stage assignment not found' 
            };
          }
          
          // Update task for next stage
          tasks[taskIndex] = {
            ...task,
            status: TASK_STATUS.PENDING,
            updatedAt: now,
            updatedBy: adminId,
            categoryId: nextStage.categoryId,
            categoryPath: nextStage.categoryName, // Update path if needed
            assignedTo: nextStage.userId,
            assignedToName: nextStage.userName,
            checkerId: nextStage.checkerId,
            checkerName: nextStage.checkerName,
            currentStage: nextStage.stageOrder,
            stageHistory: updatedStageHistory,
            review: null, // Reset review for next stage
            revisedCount: 0, // Reset revision count for new stage
            logs: [
              ...(task.logs || []),
              {
                action: 'stage_handoff',
                timestamp: now,
                performedBy: adminId,
                details: `Task moved from stage ${task.currentStage} to stage ${nextStage.stageOrder}. Assigned to ${nextStage.userName}`
              }
            ]
          };
          
          saveTasks();
          
          // Dispatch event for notifications
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('taskStageHandoff', {
              detail: {
                taskId: task.id,
                previousStage: task.currentStage,
                nextStage: nextStage.stageOrder,
                assignedTo: nextStage.userId
              }
            }));
          }
          
          return { 
            success: true, 
            task: tasks[taskIndex],
            message: `Task moved to next stage and assigned to ${nextStage.userName}`,
            isWorkflowComplete: false,
            nextStage: nextStage
          };
        }
      } else {
        // Normal approval (non-workflow task)
        tasks[taskIndex] = {
          ...task,
          status: TASK_STATUS.APPROVED,
          updatedAt: now,
          updatedBy: adminId,
          approvedBy: adminId,
          approvedAt: now,
          review: {
            ...task.review,
            reviewedAt: now,
            reviewedBy: adminId,
            approved: true,
            adminFeedback: adminFeedback
          },
          logs: [
            ...(task.logs || []),
            {
              action: 'approved',
              timestamp: now,
              performedBy: adminId,
              details: 'Task approved by admin'
            }
          ]
        };

        saveTasks();
        
        return { 
          success: true, 
          task: tasks[taskIndex],
          message: 'Task approved successfully',
          isWorkflowComplete: false
        };
      }
    } catch (error) {
      console.error('Error approving task:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Admin requires task revision
   */
  requireRevision: (taskId, adminId, feedback, approvedChecklistItems = []) => {
    try {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return { success: false, message: 'Task not found' };
      }

      const now = new Date().toISOString();
      const task = tasks[taskIndex];
      
      tasks[taskIndex] = {
        ...task,
        status: TASK_STATUS.REVISION_REQUIRED,
        updatedAt: now,
        updatedBy: adminId,
        revisedCount: (task.revisedCount || 0) + 1,
        review: {
          ...task.review,
          reviewedAt: now,
          reviewedBy: adminId,
          approved: false,
          adminFeedback: feedback,
          requiresRevision: true,
          approvedChecklistItems: approvedChecklistItems
        },
        logs: [
          ...(task.logs || []),
          {
            action: 'revision_required',
            timestamp: now,
            performedBy: adminId,
            details: `Revision required: ${feedback}`
          }
        ]
      };

      saveTasks();
      
      return { 
        success: true, 
        task: tasks[taskIndex],
        message: 'Task marked as requiring revision' 
      };
    } catch (error) {
      console.error('Error requiring revision:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  /**
   * Get tasks requiring revision for a user
   */
  getTasksRequiringRevision: (userId) => {
    return tasks.filter(t => 
      t.assignedTo === userId && 
      t.status === TASK_STATUS.REVISION_REQUIRED
    );
  }
};

export default TaskService;
// // Updated: services/taskService.js - Add these changes to your existing TaskService

// // Add at the top with other constants
// export const TASK_STATUS = {
//   PENDING: 'pending',
//   IN_PROGRESS: 'in-progress',
//   COMPLETED: 'completed',
//   CANCELLED: 'cancelled'
// };

// export const TASK_PRIORITY = {
//   LOW: 'low',
//   MEDIUM: 'medium',
//   HIGH: 'high',
//   URGENT: 'urgent'
// };

// // ==========================================
// // IN createTask FUNCTION - UPDATE TO INCLUDE:
// // ==========================================

// createTask: (taskData) => {
//   try {
//     const now = new Date().toISOString();
    
//     if (!taskData.assignedToName && taskData.assignedTo) {
//       console.warn('assignedToName missing for task creation. assignedTo:', taskData.assignedTo);
//     }
    
//     const newTask = {
//       id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       title: taskData.title,
//       description: taskData.description || '',
//       categoryId: taskData.categoryId,
//       categoryPath: taskData.categoryPath || '',
//       assignedTo: taskData.assignedTo,
//       assignedToName: taskData.assignedToName || '',
//       priority: taskData.priority || TASK_PRIORITY.MEDIUM,
//       status: taskData.status || TASK_STATUS.PENDING,
//       dueDate: taskData.dueDate || null,
//       startDate: taskData.startDate || null,
//       completedDate: null,
//       estimatedHours: taskData.estimatedHours || null,
//       actualHours: taskData.actualHours || null,
//       tags: taskData.tags || [],
//       attachments: taskData.attachments || [],
//       comments: taskData.comments || [],
      
//       // ==========================================
//       // NEW: Worksheet fields
//       // ==========================================
//       hasWorksheet: taskData.hasWorksheet || false,
//       worksheetTemplateId: taskData.worksheetTemplateId || null,
//       worksheetSubmissions: [],  // Will store submission IDs
      
//       createdAt: now,
//       updatedAt: now,
//       createdBy: taskData.createdBy || 'system',
//       updatedBy: taskData.createdBy || 'system',
//       logs: [{
//         action: 'created',
//         timestamp: now,
//         performedBy: taskData.createdBy || 'system',
//         details: `Task created${taskData.hasWorksheet ? ' with worksheet template' : ''}`
//       }]
//     };

//     tasks.push(newTask);
//     saveTasks();
    
//     console.log('✅ Task created:', {
//       title: newTask.title,
//       assignedTo: newTask.assignedTo,
//       assignedToName: newTask.assignedToName,
//       hasWorksheet: newTask.hasWorksheet,
//       worksheetTemplate: newTask.worksheetTemplateId
//     });
    
//     return { 
//       success: true, 
//       task: newTask,
//       message: 'Task created successfully' 
//     };
//   } catch (error) {
//     console.error('Error creating task:', error);
//     return { 
//       success: false, 
//       message: error.message 
//     };
//   }
// },

// // ==========================================
// // IN updateTask FUNCTION - UPDATE TO INCLUDE:
// // ==========================================

// updateTask: (taskId, updateData) => {
//   try {
//     const taskIndex = tasks.findIndex(t => t.id === taskId);
    
//     if (taskIndex === -1) {
//       return { 
//         success: false, 
//         message: 'Task not found' 
//       };
//     }

//     const now = new Date().toISOString();
//     const oldTask = tasks[taskIndex];
    
//     const finalUpdateData = { ...updateData };
//     if (finalUpdateData.assignedTo && !finalUpdateData.assignedToName) {
//       finalUpdateData.assignedToName = oldTask.assignedToName || '';
//     }
    
//     const updatedTask = {
//       ...oldTask,
//       ...finalUpdateData,
//       id: taskId,
      
//       // ==========================================
//       // PRESERVE Worksheet fields if not updating them
//       // ==========================================
//       hasWorksheet: finalUpdateData.hasWorksheet !== undefined 
//         ? finalUpdateData.hasWorksheet 
//         : oldTask.hasWorksheet,
//       worksheetTemplateId: finalUpdateData.worksheetTemplateId !== undefined 
//         ? finalUpdateData.worksheetTemplateId 
//         : oldTask.worksheetTemplateId,
//       worksheetSubmissions: finalUpdateData.worksheetSubmissions || oldTask.worksheetSubmissions || [],
      
//       updatedAt: now,
//       updatedBy: updateData.updatedBy || 'system',
//       logs: [
//         ...(oldTask.logs || []),
//         {
//           action: 'updated',
//           timestamp: now,
//           performedBy: updateData.updatedBy || 'system',
//           details: 'Task information updated'
//         }
//       ]
//     };

//     tasks[taskIndex] = updatedTask;
//     saveTasks();
    
//     return { 
//       success: true, 
//       task: updatedTask,
//       message: 'Task updated successfully' 
//     };
//   } catch (error) {
//     console.error('Error updating task:', error);
//     return { 
//       success: false, 
//       message: error.message 
//     };
//   }
// },

// // ==========================================
// // NEW HELPER METHODS
// // ==========================================

// /**
//  * Add worksheet submission ID to task
//  */
// addWorksheetSubmission: (taskId, submissionId) => {
//   try {
//     const taskIndex = tasks.findIndex(t => t.id === taskId);
    
//     if (taskIndex === -1) {
//       return { success: false, message: 'Task not found' };
//     }

//     const task = tasks[taskIndex];
    
//     // Add submission ID if not already present
//     if (!task.worksheetSubmissions) {
//       task.worksheetSubmissions = [];
//     }
    
//     if (!task.worksheetSubmissions.includes(submissionId)) {
//       task.worksheetSubmissions.push(submissionId);
//       task.updatedAt = new Date().toISOString();
      
//       saveTasks();
      
//       console.log('✅ Worksheet submission added to task:', submissionId);
//     }
    
//     return { success: true, message: 'Submission added' };
//   } catch (error) {
//     console.error('Error adding worksheet submission:', error);
//     return { success: false, message: error.message };
//   }
// },

// /**
//  * Get tasks with worksheets
//  */
// getTasksWithWorksheets: () => {
//   return tasks.filter(t => t.hasWorksheet === true && t.worksheetTemplateId);
// },

// /**
//  * Get tasks without worksheets
//  */
// getTasksWithoutWorksheets: () => {
//   return tasks.filter(t => !t.hasWorksheet || !t.worksheetTemplateId);
// },

// /**
//  * Get task worksheet info
//  */
// getTaskWorksheetInfo: (taskId) => {
//   const task = tasks.find(t => t.id === taskId);
  
//   if (!task) {
//     return null;
//   }
  
//   return {
//     taskId: task.id,
//     taskTitle: task.title,
//     hasWorksheet: task.hasWorksheet,
//     worksheetTemplateId: task.worksheetTemplateId,
//     submissionCount: task.worksheetSubmissions?.length || 0,
//     submissions: task.worksheetSubmissions || []
//   };
// },

// /**
//  * Check if task has worksheet template
//  */
// hasWorksheetTemplate: (taskId) => {
//   const task = tasks.find(t => t.id === taskId);
//   return task && task.hasWorksheet && task.worksheetTemplateId;
// },

// /**
//  * Get worksheet submission IDs for task
//  */
// getWorksheetSubmissions: (taskId) => {
//   const task = tasks.find(t => t.id === taskId);
//   return task?.worksheetSubmissions || [];
// };