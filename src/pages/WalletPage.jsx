import React, { useState, useEffect } from 'react';
import walletService, { TRANSACTION_TYPES } from '../services/walletService';
import authService from '../services/authService';
import BalanceCard from '../components/wallet/BalanceCard';
import WalletSummary from '../components/wallet/WalletSummary';
import '../components/wallet/Wallet.css';

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    limit: 50
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();

    // Listen for wallet updates
    const handleWalletUpdate = (event) => {
      if (event.detail.userId === authService.getCurrentUser()?.user_id) {
        loadWalletData();
      }
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);

    return () => {
      window.removeEventListener('walletUpdated', handleWalletUpdate);
    };
  }, []);

  useEffect(() => {
    if (wallet) {
      loadTransactions();
    }
  }, [filters, wallet]);

  const loadWalletData = () => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();

      if (!currentUser) {
        console.error('No current user found');
        setLoading(false);
        return;
      }

      const userId = currentUser.user_id;

      // Get wallet
      const userWallet = walletService.getWallet(userId);
      setWallet(userWallet);

      // Get stats
      const walletStats = walletService.getWalletStats(userId);
      setStats(walletStats);

      setLoading(false);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setLoading(false);
    }
  };

  const loadTransactions = () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      const userId = currentUser.user_id;

      const userTransactions = walletService.getUserTransactions(userId, filters);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      limit: 50
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.EARNING:
        return '=°';
      case TRANSACTION_TYPES.BONUS:
        return '<';
      case TRANSACTION_TYPES.DEDUCTION:
        return '=¸';
      case TRANSACTION_TYPES.PENALTY:
        return ' ';
      case TRANSACTION_TYPES.WITHDRAWAL:
        return '<æ';
      case TRANSACTION_TYPES.ADJUSTMENT:
        return '™';
      case TRANSACTION_TYPES.REFUND:
        return '©';
      default:
        return '=³';
    }
  };

  const getTransactionTypeBadgeClass = (type) => {
    if ([TRANSACTION_TYPES.EARNING, TRANSACTION_TYPES.BONUS, TRANSACTION_TYPES.REFUND].includes(type)) {
      return 'earning';
    }
    if ([TRANSACTION_TYPES.DEDUCTION, TRANSACTION_TYPES.PENALTY, TRANSACTION_TYPES.WITHDRAWAL].includes(type)) {
      return 'deduction';
    }
    return 'bonus';
  };

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <h2>My Wallet</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <h2>My Wallet</h2>

        <div className="wallet-grid">
          {/* Left Column - Balance and Summary */}
          <div className="wallet-left">
            <BalanceCard wallet={wallet} showDetails={true} />
            <WalletSummary stats={stats} />
          </div>

          {/* Right Column - Transactions */}
          <div className="wallet-right">
            <div className="transaction-list">
              <div className="transaction-list-header">
                <h3>Transaction History</h3>

                {/* Filters */}
                <div className="transaction-filters">
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    {Object.values(TRANSACTION_TYPES).map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    placeholder="Start Date"
                  />

                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    placeholder="End Date"
                  />

                  <select
                    name="limit"
                    value={filters.limit}
                    onChange={handleFilterChange}
                  >
                    <option value="10">Last 10</option>
                    <option value="25">Last 25</option>
                    <option value="50">Last 50</option>
                    <option value="100">Last 100</option>
                    <option value="">All</option>
                  </select>

                  {(filters.type || filters.startDate || filters.endDate) && (
                    <button onClick={clearFilters} className="btn-secondary">
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Transaction Items */}
              <div className="transaction-items">
                {transactions.length === 0 ? (
                  <div className="empty-transactions">
                    <div className="empty-transactions-icon">=°</div>
                    <h3>No Transactions Yet</h3>
                    <p>Your transaction history will appear here</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-left">
                        <div className="transaction-header">
                          <span className="transaction-icon">
                            {getTransactionIcon(transaction.type)}
                          </span>
                          <span className={`transaction-type-badge ${getTransactionTypeBadgeClass(transaction.type)}`}>
                            {transaction.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="transaction-desc">
                          {transaction.description}
                        </div>
                        <div className="transaction-time">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </div>

                        {/* Show metadata details if available */}
                        {transaction.metadata?.categoryName && (
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                            Category: {transaction.metadata.categoryName}
                          </div>
                        )}
                        {transaction.metadata?.mistakesFound !== undefined && (
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            Mistakes Found: {transaction.metadata.mistakesFound}
                          </div>
                        )}
                      </div>

                      <div className="transaction-right">
                        <div className={`transaction-amt ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                          {transaction.amount >= 0 ? '+' : ''}
                          {wallet.currency}{Math.abs(transaction.amount).toFixed(2)}
                        </div>
                        <div className={`transaction-status ${transaction.status}`}>
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
