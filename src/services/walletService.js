/**
 * Wallet Service
 * Manages user wallets, transactions, and earnings
 */

const STORAGE_KEY = 'walletData';
const TRANSACTIONS_KEY = 'transactionsData';

// Transaction types
export const TRANSACTION_TYPES = {
  EARNING: 'earning',           // Money added to wallet
  DEDUCTION: 'deduction',       // Money removed from wallet
  BONUS: 'bonus',               // Bonus payment
  PENALTY: 'penalty',           // Penalty deduction
  WITHDRAWAL: 'withdrawal',     // User withdrawal
  ADJUSTMENT: 'adjustment',     // Admin adjustment
  REFUND: 'refund'              // Refund
};

// Transaction status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Wallet status
export const WALLET_STATUS = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  CLOSED: 'closed'
};

class WalletService {
  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize storage
   */
  initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(TRANSACTIONS_KEY)) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    }
  }

  /**
   * Get all wallets
   * @returns {object} Wallets object
   */
  getWallets() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting wallets:', error);
      return {};
    }
  }

  /**
   * Save wallets to storage
   * @param {object} wallets - Wallets object
   */
  saveWallets(wallets) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
    } catch (error) {
      console.error('Error saving wallets:', error);
    }
  }

  /**
   * Get all transactions
   * @returns {Array} Transactions array
   */
  getTransactions() {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Save transactions to storage
   * @param {Array} transactions - Transactions array
   */
  saveTransactions(transactions) {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  /**
   * Get or create wallet for a user
   * @param {string} userId - User ID
   * @returns {object} Wallet object
   */
  getWallet(userId) {
    const wallets = this.getWallets();

    if (!wallets[userId]) {
      // Create new wallet
      wallets[userId] = {
        userId: userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        totalWithdrawn: 0,
        currency: '¹',
        status: WALLET_STATUS.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastTransactionAt: null
      };
      this.saveWallets(wallets);
    }

    return wallets[userId];
  }

  /**
   * Get wallet balance for a user
   * @param {string} userId - User ID
   * @returns {number} Balance
   */
  getBalance(userId) {
    const wallet = this.getWallet(userId);
    return wallet.balance;
  }

  /**
   * Add earning to user wallet
   * @param {object} earningData - Earning data
   * @returns {object} Result object
   */
  addEarning(earningData) {
    try {
      const {
        userId,
        amount,
        type = TRANSACTION_TYPES.EARNING,
        description = '',
        relatedId = null,
        relatedType = null,
        metadata = {}
      } = earningData;

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const wallets = this.getWallets();
      const wallet = this.getWallet(userId);

      // Check wallet status
      if (wallet.status !== WALLET_STATUS.ACTIVE) {
        throw new Error(`Wallet is ${wallet.status}. Cannot add earnings.`);
      }

      // Update wallet
      wallet.balance += parseFloat(amount);
      wallet.totalEarned += parseFloat(amount);
      wallet.updatedAt = new Date().toISOString();
      wallet.lastTransactionAt = new Date().toISOString();

      wallets[userId] = wallet;
      this.saveWallets(wallets);

      // Record transaction
      const transaction = this.recordTransaction({
        userId,
        type,
        amount,
        description,
        relatedId,
        relatedType,
        status: TRANSACTION_STATUS.COMPLETED,
        metadata
      });

      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('walletUpdated', {
        detail: { userId, wallet, transaction }
      }));

      return {
        success: true,
        wallet,
        transaction,
        newBalance: wallet.balance
      };
    } catch (error) {
      console.error('Error adding earning:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduct amount from user wallet
   * @param {object} deductionData - Deduction data
   * @returns {object} Result object
   */
  deductAmount(deductionData) {
    try {
      const {
        userId,
        amount,
        type = TRANSACTION_TYPES.DEDUCTION,
        description = '',
        relatedId = null,
        relatedType = null,
        metadata = {}
      } = deductionData;

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const wallets = this.getWallets();
      const wallet = this.getWallet(userId);

      // Check wallet status
      if (wallet.status !== WALLET_STATUS.ACTIVE) {
        throw new Error(`Wallet is ${wallet.status}. Cannot deduct amount.`);
      }

      // Check sufficient balance
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Update wallet
      wallet.balance -= parseFloat(amount);
      wallet.totalSpent += parseFloat(amount);
      wallet.updatedAt = new Date().toISOString();
      wallet.lastTransactionAt = new Date().toISOString();

      wallets[userId] = wallet;
      this.saveWallets(wallets);

      // Record transaction
      const transaction = this.recordTransaction({
        userId,
        type,
        amount: -amount, // Negative for deductions
        description,
        relatedId,
        relatedType,
        status: TRANSACTION_STATUS.COMPLETED,
        metadata
      });

      // Dispatch event
      window.dispatchEvent(new CustomEvent('walletUpdated', {
        detail: { userId, wallet, transaction }
      }));

      return {
        success: true,
        wallet,
        transaction,
        newBalance: wallet.balance
      };
    } catch (error) {
      console.error('Error deducting amount:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record a transaction
   * @param {object} transactionData - Transaction data
   * @returns {object} Transaction object
   */
  recordTransaction(transactionData) {
    const transactions = this.getTransactions();

    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: transactionData.userId,
      type: transactionData.type,
      amount: parseFloat(transactionData.amount),
      description: transactionData.description || '',
      status: transactionData.status || TRANSACTION_STATUS.COMPLETED,
      relatedId: transactionData.relatedId || null,
      relatedType: transactionData.relatedType || null,
      metadata: transactionData.metadata || {},
      createdAt: new Date().toISOString(),
      processedAt: transactionData.status === TRANSACTION_STATUS.COMPLETED
        ? new Date().toISOString()
        : null
    };

    transactions.push(transaction);
    this.saveTransactions(transactions);

    return transaction;
  }

  /**
   * Get transactions for a user
   * @param {string} userId - User ID
   * @param {object} filters - Filter options
   * @returns {Array} Transactions array
   */
  getUserTransactions(userId, filters = {}) {
    const allTransactions = this.getTransactions();
    let userTransactions = allTransactions.filter(t => t.userId === userId);

    // Apply filters
    if (filters.type) {
      userTransactions = userTransactions.filter(t => t.type === filters.type);
    }

    if (filters.status) {
      userTransactions = userTransactions.filter(t => t.status === filters.status);
    }

    if (filters.startDate) {
      userTransactions = userTransactions.filter(t =>
        new Date(t.createdAt) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      userTransactions = userTransactions.filter(t =>
        new Date(t.createdAt) <= new Date(filters.endDate)
      );
    }

    if (filters.relatedType) {
      userTransactions = userTransactions.filter(t => t.relatedType === filters.relatedType);
    }

    // Sort by date (newest first)
    userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    if (filters.limit) {
      userTransactions = userTransactions.slice(0, filters.limit);
    }

    return userTransactions;
  }

  /**
   * Get wallet statistics for a user
   * @param {string} userId - User ID
   * @returns {object} Statistics object
   */
  getWalletStats(userId) {
    const wallet = this.getWallet(userId);
    const transactions = this.getUserTransactions(userId);

    const earningTransactions = transactions.filter(t =>
      [TRANSACTION_TYPES.EARNING, TRANSACTION_TYPES.BONUS].includes(t.type)
    );

    const deductionTransactions = transactions.filter(t =>
      [TRANSACTION_TYPES.DEDUCTION, TRANSACTION_TYPES.PENALTY, TRANSACTION_TYPES.WITHDRAWAL].includes(t.type)
    );

    // Calculate earnings by type
    const earningsByType = {};
    transactions.forEach(t => {
      if (!earningsByType[t.type]) {
        earningsByType[t.type] = 0;
      }
      earningsByType[t.type] += t.amount;
    });

    // Calculate earnings by category (from metadata)
    const earningsByCategory = {};
    earningTransactions.forEach(t => {
      if (t.metadata?.categoryName) {
        if (!earningsByCategory[t.metadata.categoryName]) {
          earningsByCategory[t.metadata.categoryName] = 0;
        }
        earningsByCategory[t.metadata.categoryName] += t.amount;
      }
    });

    // Calculate monthly earnings
    const monthlyEarnings = {};
    earningTransactions.forEach(t => {
      const month = new Date(t.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyEarnings[month]) {
        monthlyEarnings[month] = 0;
      }
      monthlyEarnings[month] += t.amount;
    });

    return {
      wallet,
      totalTransactions: transactions.length,
      totalEarningTransactions: earningTransactions.length,
      totalDeductionTransactions: deductionTransactions.length,
      earningsByType,
      earningsByCategory,
      monthlyEarnings,
      averageTransactionAmount: transactions.length > 0
        ? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length
        : 0,
      lastTransaction: transactions.length > 0 ? transactions[0] : null
    };
  }

  /**
   * Get combined balance of all users
   * @param {object} filters - Filter options
   * @returns {object} Combined balance data
   */
  getCombinedBalance(filters = {}) {
    const wallets = this.getWallets();
    const transactions = this.getTransactions();

    let userIds = Object.keys(wallets);

    // Filter by role if provided
    if (filters.roleIds && filters.roleIds.length > 0) {
      // Need to import user service to get user roles
      // For now, we'll return all users
    }

    // Filter by status
    if (filters.status) {
      userIds = userIds.filter(userId => wallets[userId].status === filters.status);
    }

    // Calculate totals
    const totalBalance = userIds.reduce((sum, userId) => sum + wallets[userId].balance, 0);
    const totalEarned = userIds.reduce((sum, userId) => sum + wallets[userId].totalEarned, 0);
    const totalSpent = userIds.reduce((sum, userId) => sum + wallets[userId].totalSpent, 0);

    // User breakdown
    const userBreakdown = userIds.map(userId => ({
      userId,
      wallet: wallets[userId],
      transactionCount: transactions.filter(t => t.userId === userId).length
    }));

    // Sort by balance (highest first)
    userBreakdown.sort((a, b) => b.wallet.balance - a.wallet.balance);

    return {
      totalUsers: userIds.length,
      totalBalance,
      totalEarned,
      totalSpent,
      currency: '¹',
      userBreakdown,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Freeze user wallet
   * @param {string} userId - User ID
   * @param {string} reason - Reason for freezing
   * @param {string} frozenBy - Admin user ID
   * @returns {object} Result object
   */
  freezeWallet(userId, reason, frozenBy) {
    try {
      const wallets = this.getWallets();
      const wallet = this.getWallet(userId);

      wallet.status = WALLET_STATUS.FROZEN;
      wallet.frozenAt = new Date().toISOString();
      wallet.frozenBy = frozenBy;
      wallet.frozenReason = reason;
      wallet.updatedAt = new Date().toISOString();

      wallets[userId] = wallet;
      this.saveWallets(wallets);

      // Record transaction
      this.recordTransaction({
        userId,
        type: TRANSACTION_TYPES.ADJUSTMENT,
        amount: 0,
        description: `Wallet frozen: ${reason}`,
        status: TRANSACTION_STATUS.COMPLETED,
        metadata: { action: 'freeze', frozenBy, reason }
      });

      return { success: true, wallet };
    } catch (error) {
      console.error('Error freezing wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unfreeze user wallet
   * @param {string} userId - User ID
   * @param {string} unfrozenBy - Admin user ID
   * @returns {object} Result object
   */
  unfreezeWallet(userId, unfrozenBy) {
    try {
      const wallets = this.getWallets();
      const wallet = this.getWallet(userId);

      wallet.status = WALLET_STATUS.ACTIVE;
      wallet.unfrozenAt = new Date().toISOString();
      wallet.unfrozenBy = unfrozenBy;
      wallet.updatedAt = new Date().toISOString();

      wallets[userId] = wallet;
      this.saveWallets(wallets);

      // Record transaction
      this.recordTransaction({
        userId,
        type: TRANSACTION_TYPES.ADJUSTMENT,
        amount: 0,
        description: 'Wallet unfrozen',
        status: TRANSACTION_STATUS.COMPLETED,
        metadata: { action: 'unfreeze', unfrozenBy }
      });

      return { success: true, wallet };
    } catch (error) {
      console.error('Error unfreezing wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin adjustment to wallet balance
   * @param {object} adjustmentData - Adjustment data
   * @returns {object} Result object
   */
  adminAdjustment(adjustmentData) {
    const { userId, amount, reason, adjustedBy } = adjustmentData;

    if (amount > 0) {
      return this.addEarning({
        userId,
        amount,
        type: TRANSACTION_TYPES.ADJUSTMENT,
        description: `Admin adjustment: ${reason}`,
        metadata: { adjustedBy, reason, action: 'credit' }
      });
    } else if (amount < 0) {
      return this.deductAmount({
        userId,
        amount: Math.abs(amount),
        type: TRANSACTION_TYPES.ADJUSTMENT,
        description: `Admin adjustment: ${reason}`,
        metadata: { adjustedBy, reason, action: 'debit' }
      });
    }

    return { success: false, error: 'Invalid adjustment amount' };
  }

  /**
   * Export wallet data
   * @param {string} userId - User ID (optional, exports all if not provided)
   * @returns {string} JSON string
   */
  exportWalletData(userId = null) {
    if (userId) {
      const wallet = this.getWallet(userId);
      const transactions = this.getUserTransactions(userId);
      return JSON.stringify({ wallet, transactions }, null, 2);
    }

    const wallets = this.getWallets();
    const transactions = this.getTransactions();
    return JSON.stringify({ wallets, transactions }, null, 2);
  }

  /**
   * Import wallet data
   * @param {string} jsonData - JSON string of wallet data
   * @returns {object} Result object
   */
  importWalletData(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      if (data.wallets) {
        this.saveWallets(data.wallets);
      }

      if (data.transactions) {
        this.saveTransactions(data.transactions);
      }

      return { success: true };
    } catch (error) {
      console.error('Error importing wallet data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all wallet data (use with caution)
   */
  clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
    this.initializeStorage();
    return { success: true };
  }
}

// Create singleton instance
const walletService = new WalletService();

export default walletService;
