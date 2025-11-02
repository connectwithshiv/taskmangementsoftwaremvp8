// services/checklistService.js - Core Checklist Service

const STORAGE_KEYS = {
  CHECKLISTS: 'checklists'
};

// Helper: Get all data from localStorage with chunking support
const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
  }
  return [];
};

// Helper: Save data to localStorage with chunking support
const setStorageData = (key, data) => {
  try {
    const jsonData = JSON.stringify(data);
    
    // If data exceeds 1MB, use chunking
    const maxChunkSize = 1000000;
    if (jsonData.length > maxChunkSize) {
      const chunks = [];
      for (let i = 0; i < jsonData.length; i += maxChunkSize) {
        chunks.push(jsonData.slice(i, i + maxChunkSize));
      }
      
      // Clear old chunks
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.startsWith(`${key}_chunk_`)) {
          localStorage.removeItem(storageKey);
        }
      });
      
      // Save new chunks
      chunks.forEach((chunk, index) => {
        localStorage.setItem(`${key}_chunk_${index}`, chunk);
      });
      localStorage.setItem(`${key}_chunks`, chunks.length.toString());
      localStorage.removeItem(key);
    } else {
      // Save as single entry
      localStorage.setItem(key, jsonData);
      localStorage.removeItem(`${key}_chunks`);
      
      // Clear any existing chunks
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.startsWith(`${key}_chunk_`)) {
          localStorage.removeItem(storageKey);
        }
      });
    }
    return true;
  } catch (error) {
    console.error(`Error writing to ${key}:`, error);
    return false;
  }
};

// Helper: Load chunked data
const getChunkedData = (key) => {
  try {
    const chunks = localStorage.getItem(`${key}_chunks`);
    
    if (chunks) {
      const chunkCount = parseInt(chunks);
      let fullData = '';
      for (let i = 0; i < chunkCount; i++) {
        fullData += localStorage.getItem(`${key}_chunk_${i}`) || '';
      }
      return JSON.parse(fullData);
    }
    
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading chunked data from ${key}:`, error);
    return [];
  }
};

const ChecklistService = {
  // ==========================================
  // CHECKLIST OPERATIONS
  // ==========================================

  /**
   * Get all checklists
   */
  getAllChecklists: () => {
    return getChunkedData(STORAGE_KEYS.CHECKLISTS);
  },

  /**
   * Get checklist by ID
   */
  getChecklistById: (checklistId) => {
    const checklists = ChecklistService.getAllChecklists();
    return checklists.find(c => c.id === checklistId);
  },

  /**
   * Get checklist by category ID
   * Supports both single categoryId and array of categoryIds
   */
  getChecklistByCategory: (categoryId) => {
    const checklists = ChecklistService.getAllChecklists();
    return checklists.find(c => {
      if (Array.isArray(c.categoryIds)) {
        return c.categoryIds.includes(categoryId);
      }
      return c.categoryId === categoryId;
    });
  },

  /**
   * Get all checklists for a category
   * Supports both single categoryId and array of categoryIds
   */
  getChecklistsByCategory: (categoryId) => {
    const checklists = ChecklistService.getAllChecklists();
    return checklists.filter(c => {
      if (Array.isArray(c.categoryIds)) {
        return c.categoryIds.includes(categoryId);
      }
      return c.categoryId === categoryId;
    });
  },

  /**
   * Create new checklist
   */
  createChecklist: (checklistData) => {
    try {
      // Support both single categoryId and array of categoryIds
      const hasCategoryId = checklistData.categoryId || (checklistData.categoryIds && checklistData.categoryIds.length > 0);
      
      if (!checklistData.title || !hasCategoryId) {
        return {
          success: false,
          message: 'Checklist title and at least one category ID are required'
        };
      }

      const checklists = ChecklistService.getAllChecklists();
      
      // Normalize categoryIds to an array for checking
      const categoryIdsToCheck = Array.isArray(checklistData.categoryIds) 
        ? checklistData.categoryIds 
        : [checklistData.categoryId];
      
      // Check if any of these categories already have a checklist
      const existingChecklist = checklists.find(c => {
        const cCategoryIds = Array.isArray(c.categoryIds) 
          ? c.categoryIds 
          : (c.categoryId ? [c.categoryId] : []);
        
        return cCategoryIds.some(id => categoryIdsToCheck.includes(id));
      });
      
      if (existingChecklist) {
        return {
          success: false,
          message: 'One or more selected categories already have a checklist. Update existing or delete first.'
        };
      }

      // Normalize data - convert single categoryId to categoryIds array for consistency
      const normalizedData = {
        ...checklistData,
        categoryIds: Array.isArray(checklistData.categoryIds) 
          ? checklistData.categoryIds 
          : (checklistData.categoryId ? [checklistData.categoryId] : [])
      };
      
      // Remove single categoryId field if categoryIds exists
      delete normalizedData.categoryId;

      const newChecklist = {
        id: `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...normalizedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      checklists.push(newChecklist);
      const saved = setStorageData(STORAGE_KEYS.CHECKLISTS, checklists);

      if (!saved) {
        return {
          success: false,
          message: 'Failed to save checklist to storage'
        };
      }

      return {
        success: true,
        checklist: newChecklist,
        message: 'Checklist created successfully'
      };
    } catch (error) {
      console.error('Error creating checklist:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Update checklist
   */
  updateChecklist: (checklistId, updateData) => {
    try {
      const checklists = ChecklistService.getAllChecklists();
      const index = checklists.findIndex(c => c.id === checklistId);

      if (index === -1) {
        return {
          success: false,
          message: 'Checklist not found'
        };
      }

      // Normalize categoryIds
      if (updateData.categoryIds || updateData.categoryId) {
        updateData.categoryIds = Array.isArray(updateData.categoryIds) 
          ? updateData.categoryIds 
          : (updateData.categoryId ? [updateData.categoryId] : []);
        delete updateData.categoryId;
      }

      const updated = {
        ...checklists[index],
        ...updateData,
        id: checklistId,
        updatedAt: new Date().toISOString()
      };

      checklists[index] = updated;
      const saved = setStorageData(STORAGE_KEYS.CHECKLISTS, checklists);

      if (!saved) {
        return {
          success: false,
          message: 'Failed to save checklist updates'
        };
      }

      return {
        success: true,
        checklist: updated,
        message: 'Checklist updated successfully'
      };
    } catch (error) {
      console.error('Error updating checklist:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Delete checklist
   */
  deleteChecklist: (checklistId) => {
    try {
      const checklists = ChecklistService.getAllChecklists();
      const filteredChecklists = checklists.filter(c => c.id !== checklistId);

      const saved = setStorageData(STORAGE_KEYS.CHECKLISTS, filteredChecklists);

      if (!saved) {
        return {
          success: false,
          message: 'Failed to delete checklist'
        };
      }

      return {
        success: true,
        message: 'Checklist deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting checklist:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Check if category has a checklist
   */
  hasChecklist: (categoryId) => {
    const checklist = ChecklistService.getChecklistByCategory(categoryId);
    return !!checklist;
  },

  // ==========================================
  // EXPORT & UTILITIES
  // ==========================================

  /**
   * Export all checklists
   */
  exportChecklists: () => {
    return {
      checklists: ChecklistService.getAllChecklists(),
      exportedAt: new Date().toISOString()
    };
  },

  /**
   * Clear all checklists (use with caution)
   */
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHECKLISTS);
      
      // Clear chunks
      Object.keys(localStorage).forEach(key => {
        if (key.includes('checklists_chunk_')) {
          localStorage.removeItem(key);
        }
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

export default ChecklistService;

