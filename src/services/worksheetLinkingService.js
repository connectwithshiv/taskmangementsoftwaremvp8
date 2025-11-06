/**
 * WorksheetLinkingService - Manages worksheet field linkings between workflow stages
 * Storage: localStorage key 'taskManagement_worksheet_linkings'
 *
 * Purpose: Links output fields from one stage's worksheet to input fields of the next stage
 * This allows data to flow automatically from one Doer to the next in the workflow
 */

const STORAGE_KEY = 'taskManagement_worksheet_linkings';

// Initialize worksheet linkings from localStorage
let worksheetLinkings = [];

const loadWorksheetLinkings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      worksheetLinkings = JSON.parse(data);
    } else {
      worksheetLinkings = [];
    }
  } catch (error) {
    console.error('Error loading worksheet linkings:', error);
    worksheetLinkings = [];
  }
};

const saveWorksheetLinkings = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(worksheetLinkings));

    if (typeof window !== 'undefined') {
      console.log('📢 WorksheetLinkingService: Dispatching worksheetLinkingsUpdated event');
      window.dispatchEvent(new Event('worksheetLinkingsUpdated'));
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving worksheet linkings:', error);
    return { success: false, error: error.message };
  }
};

loadWorksheetLinkings();

export const WorksheetLinkingService = {
  /**
   * Get all worksheet linkings
   */
  getAllWorksheetLinkings: () => {
    loadWorksheetLinkings();
    return worksheetLinkings;
  },

  /**
   * Get worksheet linking by ID
   */
  getWorksheetLinkingById: (linkingId) => {
    return worksheetLinkings.find(l => l.id === linkingId);
  },

  /**
   * Get worksheet linking by workflow ID
   * Returns the linking configuration for a specific workflow
   */
  getWorksheetLinkingByWorkflow: (workflowId) => {
    return worksheetLinkings.find(l => l.workflowId === workflowId);
  },

  /**
   * Get field mapping for a specific stage transition
   * @param {string} workflowId - The workflow ID
   * @param {number} fromStageOrder - Source stage order
   * @param {number} toStageOrder - Target stage order
   * @returns {Array} Array of field mappings { fromFieldId, toFieldId, fromFieldLabel, toFieldLabel }
   */
  getFieldMappingForStageTransition: (workflowId, fromStageOrder, toStageOrder) => {
    const linking = WorksheetLinkingService.getWorksheetLinkingByWorkflow(workflowId);
    if (!linking) return [];

    const stageMapping = linking.stageMappings.find(
      sm => sm.fromStageOrder === fromStageOrder && sm.toStageOrder === toStageOrder
    );

    return stageMapping ? stageMapping.fieldMappings : [];
  },

  /**
   * Create a new worksheet linking configuration
   * @param {Object} linkingData - {
   *   workflowId, workflowName, name, description,
   *   stageMappings: [{
   *     fromStageOrder, toStageOrder,
   *     fromCategoryId, toCategoryId,
   *     fromCategoryName, toCategoryName,
   *     fieldMappings: [{ fromFieldId, toFieldId, fromFieldLabel, toFieldLabel }]
   *   }]
   * }
   */
  createWorksheetLinking: (linkingData) => {
    try {
      // Validation
      if (!linkingData.name || !linkingData.name.trim()) {
        return { success: false, message: 'Linking name is required' };
      }

      if (!linkingData.workflowId) {
        return { success: false, message: 'Workflow ID is required' };
      }

      if (!linkingData.stageMappings || linkingData.stageMappings.length === 0) {
        return { success: false, message: 'At least one stage mapping is required' };
      }

      // Check if linking already exists for this workflow
      const existing = worksheetLinkings.find(l => l.workflowId === linkingData.workflowId);
      if (existing) {
        return {
          success: false,
          message: 'A worksheet linking configuration already exists for this workflow. Please update the existing one.'
        };
      }

      const now = new Date().toISOString();
      const newLinking = {
        id: `linking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId: linkingData.workflowId,
        workflowName: linkingData.workflowName || '',
        name: linkingData.name.trim(),
        description: linkingData.description || '',
        stageMappings: linkingData.stageMappings.map(sm => ({
          fromStageOrder: sm.fromStageOrder,
          toStageOrder: sm.toStageOrder,
          fromCategoryId: sm.fromCategoryId,
          toCategoryId: sm.toCategoryId,
          fromCategoryName: sm.fromCategoryName || '',
          toCategoryName: sm.toCategoryName || '',
          fieldMappings: sm.fieldMappings.map(fm => ({
            fromFieldId: fm.fromFieldId,
            toFieldId: fm.toFieldId,
            fromFieldLabel: fm.fromFieldLabel || '',
            toFieldLabel: fm.toFieldLabel || ''
          }))
        })),
        createdAt: now,
        updatedAt: now,
        createdBy: linkingData.createdBy || 'system',
        isActive: true
      };

      worksheetLinkings.push(newLinking);
      const saveResult = saveWorksheetLinkings();

      if (!saveResult.success) {
        worksheetLinkings.pop(); // Rollback
        return { success: false, message: saveResult.error };
      }

      console.log('✅ Worksheet linking created:', newLinking.id);
      return {
        success: true,
        linking: newLinking,
        message: 'Worksheet linking created successfully'
      };
    } catch (error) {
      console.error('Error creating worksheet linking:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Update an existing worksheet linking configuration
   */
  updateWorksheetLinking: (linkingId, linkingData) => {
    try {
      const index = worksheetLinkings.findIndex(l => l.id === linkingId);
      if (index === -1) {
        return { success: false, message: 'Worksheet linking not found' };
      }

      const linking = worksheetLinkings[index];

      // Validation
      if (linkingData.name && !linkingData.name.trim()) {
        return { success: false, message: 'Linking name cannot be empty' };
      }

      // Update linking
      const updatedLinking = {
        ...linking,
        ...linkingData,
        id: linkingId, // Prevent ID change
        updatedAt: new Date().toISOString()
      };

      worksheetLinkings[index] = updatedLinking;
      const saveResult = saveWorksheetLinkings();

      if (!saveResult.success) {
        worksheetLinkings[index] = linking; // Rollback
        return { success: false, message: saveResult.error };
      }

      return {
        success: true,
        linking: updatedLinking,
        message: 'Worksheet linking updated successfully'
      };
    } catch (error) {
      console.error('Error updating worksheet linking:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Delete a worksheet linking configuration
   */
  deleteWorksheetLinking: (linkingId) => {
    try {
      const index = worksheetLinkings.findIndex(l => l.id === linkingId);
      if (index === -1) {
        return { success: false, message: 'Worksheet linking not found' };
      }

      const linking = worksheetLinkings[index];

      worksheetLinkings.splice(index, 1);
      const saveResult = saveWorksheetLinkings();

      if (!saveResult.success) {
        worksheetLinkings.splice(index, 0, linking); // Rollback
        return { success: false, message: saveResult.error };
      }

      return {
        success: true,
        message: 'Worksheet linking deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting worksheet linking:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get workflows that have worksheet linking configured
   */
  getWorkflowsWithLinking: () => {
    return worksheetLinkings.map(l => l.workflowId);
  },

  /**
   * Check if a workflow has worksheet linking configured
   */
  hasWorksheetLinking: (workflowId) => {
    return worksheetLinkings.some(l => l.workflowId === workflowId);
  },

  /**
   * Validate worksheet linking configuration
   */
  validateWorksheetLinking: (linking) => {
    const errors = [];

    if (!linking.name || !linking.name.trim()) {
      errors.push('Linking name is required');
    }

    if (!linking.workflowId) {
      errors.push('Workflow ID is required');
    }

    if (!linking.stageMappings || !Array.isArray(linking.stageMappings)) {
      errors.push('Stage mappings must be an array');
    } else if (linking.stageMappings.length === 0) {
      errors.push('At least one stage mapping is required');
    } else {
      // Validate each stage mapping
      linking.stageMappings.forEach((sm, idx) => {
        if (!sm.fromStageOrder || !sm.toStageOrder) {
          errors.push(`Stage mapping ${idx + 1}: Both from and to stage orders are required`);
        }
        if (!sm.fieldMappings || !Array.isArray(sm.fieldMappings)) {
          errors.push(`Stage mapping ${idx + 1}: Field mappings must be an array`);
        } else if (sm.fieldMappings.length === 0) {
          errors.push(`Stage mapping ${idx + 1}: At least one field mapping is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Apply field linking to task data
   * Given data from previous stage, returns pre-filled data for next stage
   * @param {string} workflowId - The workflow ID
   * @param {number} fromStageOrder - Previous stage order
   * @param {number} toStageOrder - Next stage order
   * @param {Object} sourceData - Data from previous stage { fieldId: value }
   * @returns {Object} Pre-filled data for next stage { fieldId: value }
   */
  applyFieldLinking: (workflowId, fromStageOrder, toStageOrder, sourceData) => {
    const fieldMappings = WorksheetLinkingService.getFieldMappingForStageTransition(
      workflowId,
      fromStageOrder,
      toStageOrder
    );

    if (!fieldMappings || fieldMappings.length === 0) {
      return {};
    }

    const preFilledData = {};
    fieldMappings.forEach(mapping => {
      if (sourceData[mapping.fromFieldId] !== undefined) {
        preFilledData[mapping.toFieldId] = sourceData[mapping.fromFieldId];
      }
    });

    return preFilledData;
  }
};

export default WorksheetLinkingService;
