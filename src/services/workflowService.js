/**
 * WorkflowService - Manages category-based workflow templates
 * Storage: localStorage key 'taskManagement_workflows'
 */

const STORAGE_KEY = 'taskManagement_workflows';

// Initialize workflows from localStorage
let workflows = [];

const loadWorkflows = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      workflows = JSON.parse(data);
    } else {
      workflows = [];
    }
  } catch (error) {
    console.error('Error loading workflows:', error);
    workflows = [];
  }
};

const saveWorkflows = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    
    if (typeof window !== 'undefined') {
      console.log('📢 WorkflowService: Dispatching workflowsUpdated event');
      window.dispatchEvent(new Event('workflowsUpdated'));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving workflows:', error);
    return { success: false, error: error.message };
  }
};

loadWorkflows();

export const WorkflowService = {
  /**
   * Get all workflows
   */
  getAllWorkflows: () => {
    loadWorkflows();
    return workflows;
  },

  /**
   * Get workflow by ID
   */
  getWorkflowById: (workflowId) => {
    return workflows.find(w => w.id === workflowId);
  },

  /**
   * Create a new workflow
   * @param {Object} workflowData - { name, description, categoryFlow: [{ categoryId, categoryName, order }] }
   */
  createWorkflow: (workflowData) => {
    try {
      // Validation
      if (!workflowData.name || !workflowData.name.trim()) {
        return { success: false, message: 'Workflow name is required' };
      }

      if (!workflowData.categoryFlow || workflowData.categoryFlow.length < 2) {
        return { success: false, message: 'Workflow must have at least 2 categories' };
      }

      // Check for duplicate category IDs
      const categoryIds = workflowData.categoryFlow.map(stage => stage.categoryId);
      const uniqueIds = new Set(categoryIds);
      if (categoryIds.length !== uniqueIds.size) {
        return { success: false, message: 'Duplicate categories are not allowed in workflow' };
      }

      // Check for duplicate workflow names
      if (workflows.some(w => w.name.toLowerCase() === workflowData.name.toLowerCase().trim())) {
        return { success: false, message: 'Workflow with this name already exists' };
      }

      const now = new Date().toISOString();
      const newWorkflow = {
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: workflowData.name.trim(),
        description: workflowData.description || '',
        categoryFlow: workflowData.categoryFlow.map((stage, index) => ({
          ...stage,
          order: index + 1
        })),
        createdAt: now,
        updatedAt: now,
        createdBy: workflowData.createdBy || 'system',
        isActive: true,
        taskCount: 0 // Track how many tasks use this workflow
      };

      workflows.push(newWorkflow);
      const saveResult = saveWorkflows();

      if (!saveResult.success) {
        workflows.pop(); // Rollback
        return { success: false, message: saveResult.error };
      }

      console.log('✅ Workflow created:', newWorkflow.id);
      return {
        success: true,
        workflow: newWorkflow,
        message: 'Workflow created successfully'
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Update an existing workflow
   */
  updateWorkflow: (workflowId, workflowData) => {
    try {
      const index = workflows.findIndex(w => w.id === workflowId);
      if (index === -1) {
        return { success: false, message: 'Workflow not found' };
      }

      const workflow = workflows[index];

      // Validation
      if (workflowData.name && !workflowData.name.trim()) {
        return { success: false, message: 'Workflow name cannot be empty' };
      }

      // Check if workflow is in use (optional - can allow updates)
      if (workflow.taskCount > 0 && workflowData.categoryFlow) {
        // Warn but allow update if category count matches
        if (workflowData.categoryFlow.length !== workflow.categoryFlow.length) {
          return {
            success: false,
            message: `Cannot change category count. This workflow is used by ${workflow.taskCount} task(s)`
          };
        }
      }

      // Update workflow
      const updatedWorkflow = {
        ...workflow,
        ...workflowData,
        id: workflowId, // Prevent ID change
        updatedAt: new Date().toISOString(),
        categoryFlow: workflowData.categoryFlow 
          ? workflowData.categoryFlow.map((stage, idx) => ({
              ...stage,
              order: idx + 1
            }))
          : workflow.categoryFlow
      };

      workflows[index] = updatedWorkflow;
      const saveResult = saveWorkflows();

      if (!saveResult.success) {
        workflows[index] = workflow; // Rollback
        return { success: false, message: saveResult.error };
      }

      return {
        success: true,
        workflow: updatedWorkflow,
        message: 'Workflow updated successfully'
      };
    } catch (error) {
      console.error('Error updating workflow:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Delete a workflow
   */
  deleteWorkflow: (workflowId) => {
    try {
      const index = workflows.findIndex(w => w.id === workflowId);
      if (index === -1) {
        return { success: false, message: 'Workflow not found' };
      }

      const workflow = workflows[index];

      // Check if workflow is in use
      if (workflow.taskCount > 0) {
        return {
          success: false,
          message: `Cannot delete workflow. It is currently used by ${workflow.taskCount} task(s)`
        };
      }

      workflows.splice(index, 1);
      const saveResult = saveWorkflows();

      if (!saveResult.success) {
        workflows.splice(index, 0, workflow); // Rollback
        return { success: false, message: saveResult.error };
      }

      return {
        success: true,
        message: 'Workflow deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting workflow:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Increment task count for a workflow
   */
  incrementTaskCount: (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      workflow.taskCount = (workflow.taskCount || 0) + 1;
      saveWorkflows();
    }
  },

  /**
   * Decrement task count for a workflow
   */
  decrementTaskCount: (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow && workflow.taskCount > 0) {
      workflow.taskCount = workflow.taskCount - 1;
      saveWorkflows();
    }
  },

  /**
   * Get workflows by category ID (find workflows that include this category)
   */
  getWorkflowsByCategory: (categoryId) => {
    return workflows.filter(workflow =>
      workflow.categoryFlow.some(stage => stage.categoryId === categoryId)
    );
  },

  /**
   * Validate workflow structure
   */
  validateWorkflow: (workflow) => {
    const errors = [];

    if (!workflow.name || !workflow.name.trim()) {
      errors.push('Workflow name is required');
    }

    if (!workflow.categoryFlow || !Array.isArray(workflow.categoryFlow)) {
      errors.push('Category flow must be an array');
    } else if (workflow.categoryFlow.length < 2) {
      errors.push('Workflow must have at least 2 categories');
    } else {
      // Check for duplicates
      const categoryIds = workflow.categoryFlow.map(s => s.categoryId);
      const uniqueIds = new Set(categoryIds);
      if (categoryIds.length !== uniqueIds.size) {
        errors.push('Duplicate categories are not allowed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default WorkflowService;

