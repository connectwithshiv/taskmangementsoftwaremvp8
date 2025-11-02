import React from 'react';
import './Wallet.css';

const WalletSummary = ({ stats }) => {
  if (!stats) {
    return (
      <div className="wallet-summary">
        <h3>Wallet Summary</h3>
        <p>Loading...</p>
      </div>
    );
  }

  const { wallet, totalTransactions, totalEarningTransactions, totalDeductionTransactions } = stats;

  return (
    <div className="wallet-summary">
      <h3>Wallet Summary</h3>

      <div className="summary-grid">
        {/* Transaction Statistics */}
        <div className="summary-card">
          <div className="summary-icon">=Ê</div>
          <div className="summary-content">
            <h4>Total Transactions</h4>
            <div className="summary-value">{totalTransactions}</div>
          </div>
        </div>

        <div className="summary-card positive">
          <div className="summary-icon">=°</div>
          <div className="summary-content">
            <h4>Earning Transactions</h4>
            <div className="summary-value">{totalEarningTransactions}</div>
          </div>
        </div>

        <div className="summary-card negative">
          <div className="summary-icon">=¸</div>
          <div className="summary-content">
            <h4>Deduction Transactions</h4>
            <div className="summary-value">{totalDeductionTransactions}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">=È</div>
          <div className="summary-content">
            <h4>Average Transaction</h4>
            <div className="summary-value">
              {wallet.currency}{stats.averageTransactionAmount?.toFixed(2) || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Earnings by Category */}
      {stats.earningsByCategory && Object.keys(stats.earningsByCategory).length > 0 && (
        <div className="summary-section">
          <h4>Earnings by Category</h4>
          <div className="category-earnings">
            {Object.entries(stats.earningsByCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => (
                <div key={category} className="category-earning-item">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">
                    {wallet.currency}{amount.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Monthly Earnings */}
      {stats.monthlyEarnings && Object.keys(stats.monthlyEarnings).length > 0 && (
        <div className="summary-section">
          <h4>Monthly Earnings</h4>
          <div className="monthly-earnings">
            {Object.entries(stats.monthlyEarnings)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([month, amount]) => {
                const date = new Date(month + '-01');
                const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return (
                  <div key={month} className="monthly-earning-item">
                    <span className="month-name">{monthName}</span>
                    <span className="month-amount">
                      {wallet.currency}{amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Earnings by Type */}
      {stats.earningsByType && Object.keys(stats.earningsByType).length > 0 && (
        <div className="summary-section">
          <h4>Transactions by Type</h4>
          <div className="type-earnings">
            {Object.entries(stats.earningsByType)
              .filter(([type, amount]) => amount !== 0)
              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
              .map(([type, amount]) => (
                <div key={type} className="type-earning-item">
                  <span className="type-name">{type.replace('_', ' ').toUpperCase()}</span>
                  <span className={`type-amount ${amount >= 0 ? 'positive' : 'negative'}`}>
                    {amount >= 0 ? '+' : ''}{wallet.currency}{amount.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Last Transaction */}
      {stats.lastTransaction && (
        <div className="summary-section">
          <h4>Latest Transaction</h4>
          <div className="last-transaction">
            <div className="transaction-info">
              <span className="transaction-type">{stats.lastTransaction.type.toUpperCase()}</span>
              <span className={`transaction-amount ${stats.lastTransaction.amount >= 0 ? 'positive' : 'negative'}`}>
                {stats.lastTransaction.amount >= 0 ? '+' : ''}{wallet.currency}{Math.abs(stats.lastTransaction.amount).toFixed(2)}
              </span>
            </div>
            <div className="transaction-description">{stats.lastTransaction.description}</div>
            <div className="transaction-date">
              {new Date(stats.lastTransaction.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSummary;
