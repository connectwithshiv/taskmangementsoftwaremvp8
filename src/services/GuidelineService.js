// services/guidelineService.js - Core Guidelines Service

const STORAGE_KEYS = {
  GUIDELINES: 'guidelines'
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

const GuidelineService = {
  // ==========================================
  // GUIDELINE OPERATIONS
  // ==========================================

  /**
   * Get all guidelines
   */
  getAllGuidelines: () => {
    return getChunkedData(STORAGE_KEYS.GUIDELINES);
  },

  /**
   * Get guideline by ID
   */
  getGuidelineById: (guidelineId) => {
    const guidelines = GuidelineService.getAllGuidelines();
    return guidelines.find(g => g.id === guidelineId);
  },

  /**
   * Get guideline by category ID
   * Supports both single categoryId and array of categoryIds
   */
  getGuidelineByCategory: (categoryId) => {
    const guidelines = GuidelineService.getAllGuidelines();
    return guidelines.find(g => {
      if (Array.isArray(g.categoryIds)) {
        return g.categoryIds.includes(categoryId);
      }
      return g.categoryId === categoryId;
    });
  },

  /**
   * Get all guidelines for a category
   * Supports both single categoryId and array of categoryIds
   */
  getGuidelinesByCategory: (categoryId) => {
    const guidelines = GuidelineService.getAllGuidelines();
    return guidelines.filter(g => {
      if (Array.isArray(g.categoryIds)) {
        return g.categoryIds.includes(categoryId);
      }
      return g.categoryId === categoryId;
    });
  },

  /**
   * Create new guideline
   */
  createGuideline: (guidelineData) => {
    try {
      // Support both single categoryId and array of categoryIds
      const hasCategoryId = guidelineData.categoryId || (guidelineData.categoryIds && guidelineData.categoryIds.length > 0);
      
      if (!guidelineData.title || !hasCategoryId) {
        return {
          success: false,
          message: 'Guideline title and at least one category ID are required'
        };
      }

      const guidelines = GuidelineService.getAllGuidelines();
      
      // Normalize categoryIds to an array for checking
      const categoryIdsToCheck = Array.isArray(guidelineData.categoryIds) 
        ? guidelineData.categoryIds 
        : [guidelineData.categoryId];
      
      // Check if any of these categories already have a guideline
      const existingGuideline = guidelines.find(g => {
        const gCategoryIds = Array.isArray(g.categoryIds) 
          ? g.categoryIds 
          : (g.categoryId ? [g.categoryId] : []);
        
        return gCategoryIds.some(id => categoryIdsToCheck.includes(id));
      });
      
      if (existingGuideline) {
        return {
          success: false,
          message: 'One or more selected categories already have a guideline. Update existing or delete first.'
        };
      }

      // Normalize data - convert single categoryId to categoryIds array for consistency
      const normalizedData = {
        ...guidelineData,
        categoryIds: Array.isArray(guidelineData.categoryIds) 
          ? guidelineData.categoryIds 
          : (guidelineData.categoryId ? [guidelineData.categoryId] : [])
      };
      
      // Remove single categoryId field if categoryIds exists
      delete normalizedData.categoryId;

      const newGuideline = {
        id: `guideline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...normalizedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      guidelines.push(newGuideline);
      const saved = setStorageData(STORAGE_KEYS.GUIDELINES, guidelines);

      if (!saved) {
        return {
          success: false,
          message: 'Failed to save guideline to storage'
        };
      }

      return {
        success: true,
        guideline: newGuideline,
        message: 'Guideline created successfully'
      };
    } catch (error) {
      console.error('Error creating guideline:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Update guideline
   */
  updateGuideline: (guidelineId, updateData) => {
    try {
      const guidelines = GuidelineService.getAllGuidelines();
      const index = guidelines.findIndex(g => g.id === guidelineId);

      if (index === -1) {
        return {
          success: false,
          message: 'Guideline not found'
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
        ...guidelines[index],
        ...updateData,
        id: guidelineId,
        updatedAt: new Date().toISOString()
      };

      guidelines[index] = updated;
      const saved = setStorageData(STORAGE_KEYS.GUIDELINES, guidelines);

      if (!saved) {
        return {
          success: false,
          message: 'Failed to save guideline updates'
        };
      }

      return {
        success: true,
        guideline: updated,
        message: 'Guideline updated successfully'
      };
    } catch (error) {
      console.error('Error updating guideline:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Delete guideline
   */
  deleteGuideline: (guidelineId) => {
    try {
      const guidelines = GuidelineService.getAllGuidelines();
      const filteredGuidelines = guidelines.filter(g => g.id !== guidelineId);

      const saved = setStorageData(STORAGE_KEYS.GUIDELINES, filteredGuidelines);

      if (!saved) {
        return {
          success: false,
          message: 'Failed to delete guideline'
        };
      }

      return {
        success: true,
        message: 'Guideline deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting guideline:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Check if category has a guideline
   */
  hasGuideline: (categoryId) => {
    const guideline = GuidelineService.getGuidelineByCategory(categoryId);
    return !!guideline;
  },

  // ==========================================
  // EXPORT & UTILITIES
  // ==========================================

  /**
   * Export all guidelines
   */
  exportGuidelines: () => {
    return {
      guidelines: GuidelineService.getAllGuidelines(),
      exportedAt: new Date().toISOString()
    };
  },

  /**
   * Clear all guidelines (use with caution)
   */
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GUIDELINES);
      
      // Clear chunks
      Object.keys(localStorage).forEach(key => {
        if (key.includes('guidelines_chunk_')) {
          localStorage.removeItem(key);
        }
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

export default GuidelineService;

