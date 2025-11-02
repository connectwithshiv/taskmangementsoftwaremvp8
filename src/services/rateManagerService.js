/**
 * Rate Manager Service
 * Manages category-wise rates for doers and checkers
 */

const STORAGE_KEY = 'rateManagerData';

class RateManagerService {
  constructor() {
    this.initializeDefaultRates();
  }

  /**
   * Initialize default rates in storage
   */
  initializeDefaultRates() {
    const existingRates = this.getRates();
    if (!existingRates || existingRates.length === 0) {
      const defaultRates = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRates));
    }
  }

  /**
   * Get all rates from storage
   * @returns {Array} Array of rate configurations
   */
  getRates() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting rates:', error);
      return [];
    }
  }

  /**
   * Save rates to storage
   * @param {Array} rates - Array of rate configurations
   */
  saveRates(rates) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
      return { success: true };
    } catch (error) {
      console.error('Error saving rates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get rate configuration for a specific category
   * @param {string} categoryId - Category ID
   * @returns {object|null} Rate configuration or null
   */
  getRateByCategoryId(categoryId) {
    const rates = this.getRates();
    return rates.find(rate => rate.categoryId === categoryId) || null;
  }

  /**
   * Create or update rate configuration for a category
   * @param {object} rateData - Rate configuration data
   * @returns {object} Result object with success status
   */
  setRate(rateData) {
    try {
      const rates = this.getRates();
      const existingIndex = rates.findIndex(r => r.categoryId === rateData.categoryId);

      const rateConfig = {
        id: rateData.id || `rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        categoryId: rateData.categoryId,
        categoryName: rateData.categoryName,
        categoryPath: rateData.categoryPath,

        // Doer rate configuration
        doerRate: {
          amount: parseFloat(rateData.doerRate?.amount || 0),
          currency: rateData.doerRate?.currency || '₹',
          usesCategoryAmount: rateData.doerRate?.usesCategoryAmount !== false, // Default true
        },

        // Checker rate configuration (percentage per mistake)
        checkerRate: {
          percentagePerMistake: parseFloat(rateData.checkerRate?.percentagePerMistake || 0),
          currency: rateData.checkerRate?.currency || '₹',
          maxMistakes: parseInt(rateData.checkerRate?.maxMistakes || 100), // Max mistakes to count
          minEarning: parseFloat(rateData.checkerRate?.minEarning || 0), // Minimum earning per review
        },

        // Metadata
        effectiveFrom: rateData.effectiveFrom || new Date().toISOString(),
        effectiveTo: rateData.effectiveTo || null,
        isActive: rateData.isActive !== false,
        createdAt: rateData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: rateData.createdBy || 'system',
        updatedBy: rateData.updatedBy || 'system',
      };

      if (existingIndex >= 0) {
        // Update existing rate
        rates[existingIndex] = { ...rates[existingIndex], ...rateConfig };
      } else {
        // Add new rate
        rates.push(rateConfig);
      }

      this.saveRates(rates);
      return { success: true, rate: rateConfig };
    } catch (error) {
      console.error('Error setting rate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete rate configuration for a category
   * @param {string} categoryId - Category ID
   * @returns {object} Result object with success status
   */
  deleteRate(categoryId) {
    try {
      const rates = this.getRates();
      const filteredRates = rates.filter(r => r.categoryId !== categoryId);
      this.saveRates(filteredRates);
      return { success: true };
    } catch (error) {
      console.error('Error deleting rate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate doer earning for a task
   * @param {string} categoryId - Category ID
   * @param {number} categoryAmount - Category amount
   * @returns {number} Earning amount
   */
  calculateDoerEarning(categoryId, categoryAmount) {
    const rateConfig = this.getRateByCategoryId(categoryId);

    if (!rateConfig || !rateConfig.isActive) {
      // If no rate config, use category amount
      return parseFloat(categoryAmount || 0);
    }

    // Check if rate is currently effective
    const now = new Date();
    if (rateConfig.effectiveFrom && new Date(rateConfig.effectiveFrom) > now) {
      return parseFloat(categoryAmount || 0);
    }
    if (rateConfig.effectiveTo && new Date(rateConfig.effectiveTo) < now) {
      return parseFloat(categoryAmount || 0);
    }

    // Use category amount by default
    if (rateConfig.doerRate.usesCategoryAmount) {
      return parseFloat(categoryAmount || 0);
    }

    // Use custom amount if specified
    return parseFloat(rateConfig.doerRate.amount || categoryAmount || 0);
  }

  /**
   * Calculate checker earning based on mistakes found
   * @param {string} categoryId - Category ID
   * @param {number} categoryAmount - Category amount (base for percentage)
   * @param {number} mistakesFound - Number of mistakes found
   * @returns {object} Earning details
   */
  calculateCheckerEarning(categoryId, categoryAmount, mistakesFound) {
    const rateConfig = this.getRateByCategoryId(categoryId);

    if (!rateConfig || !rateConfig.isActive) {
      return {
        amount: 0,
        mistakesFound: mistakesFound,
        percentagePerMistake: 0,
        calculation: 'No rate configuration found'
      };
    }

    // Check if rate is currently effective
    const now = new Date();
    if (rateConfig.effectiveFrom && new Date(rateConfig.effectiveFrom) > now) {
      return {
        amount: 0,
        mistakesFound: mistakesFound,
        percentagePerMistake: 0,
        calculation: 'Rate not yet effective'
      };
    }
    if (rateConfig.effectiveTo && new Date(rateConfig.effectiveTo) < now) {
      return {
        amount: 0,
        mistakesFound: mistakesFound,
        percentagePerMistake: 0,
        calculation: 'Rate expired'
      };
    }

    const percentagePerMistake = rateConfig.checkerRate.percentagePerMistake;
    const maxMistakes = rateConfig.checkerRate.maxMistakes;
    const minEarning = rateConfig.checkerRate.minEarning;

    // Cap mistakes at maximum
    const countedMistakes = Math.min(mistakesFound, maxMistakes);

    // Calculate: (categoryAmount * percentagePerMistake * mistakesFound) / 100
    let earning = (parseFloat(categoryAmount || 0) * percentagePerMistake * countedMistakes) / 100;

    // Apply minimum earning
    earning = Math.max(earning, minEarning);

    return {
      amount: Math.round(earning * 100) / 100, // Round to 2 decimal places
      mistakesFound: mistakesFound,
      countedMistakes: countedMistakes,
      percentagePerMistake: percentagePerMistake,
      baseAmount: categoryAmount,
      minEarning: minEarning,
      calculation: `(${categoryAmount} × ${percentagePerMistake}% × ${countedMistakes} mistakes) = ${earning.toFixed(2)}`
    };
  }

  /**
   * Get all categories with their rate configurations
   * @param {Array} categories - Array of category objects
   * @returns {Array} Categories with rate info
   */
  getCategoriesWithRates(categories) {
    const rates = this.getRates();
    const rateMap = new Map(rates.map(r => [r.categoryId, r]));

    return categories.map(category => ({
      ...category,
      rateConfig: rateMap.get(category.id) || null,
      hasRateConfig: rateMap.has(category.id)
    }));
  }

  /**
   * Get statistics about rate configurations
   * @returns {object} Statistics
   */
  getRateStats() {
    const rates = this.getRates();
    const now = new Date();

    const activeRates = rates.filter(r => {
      if (!r.isActive) return false;
      if (r.effectiveFrom && new Date(r.effectiveFrom) > now) return false;
      if (r.effectiveTo && new Date(r.effectiveTo) < now) return false;
      return true;
    });

    return {
      totalRates: rates.length,
      activeRates: activeRates.length,
      inactiveRates: rates.length - activeRates.length,
      averageCheckerRate: activeRates.length > 0
        ? activeRates.reduce((sum, r) => sum + r.checkerRate.percentagePerMistake, 0) / activeRates.length
        : 0
    };
  }

  /**
   * Import rates from JSON data
   * @param {Array} ratesData - Array of rate configurations
   * @returns {object} Result object
   */
  importRates(ratesData) {
    try {
      if (!Array.isArray(ratesData)) {
        throw new Error('Invalid data format. Expected an array.');
      }

      this.saveRates(ratesData);
      return { success: true, imported: ratesData.length };
    } catch (error) {
      console.error('Error importing rates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export rates as JSON
   * @returns {string} JSON string of all rates
   */
  exportRates() {
    const rates = this.getRates();
    return JSON.stringify(rates, null, 2);
  }

  /**
   * Clear all rates (use with caution)
   */
  clearAllRates() {
    localStorage.removeItem(STORAGE_KEY);
    this.initializeDefaultRates();
    return { success: true };
  }
}

// Create singleton instance
const rateManagerService = new RateManagerService();

export default rateManagerService;
