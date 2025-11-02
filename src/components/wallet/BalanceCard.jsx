import React from 'react';
import './Wallet.css';

const BalanceCard = ({ wallet, showDetails = true }) => {
  if (!wallet) {
    return (
      <div className="balance-card loading">
        <div className="balance-header">
          <h3>Wallet Balance</h3>
        </div>
        <div className="balance-amount">
          <span className="currency">¹</span>
          <span className="amount">0.00</span>
        </div>
        <p className="balance-status">Loading...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'frozen':
        return '#dc3545';
      case 'closed':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '';
      case 'frozen':
        return 'D';
      case 'closed':
        return '';
      default:
        return '?';
    }
  };

  return (
    <div className="balance-card">
      <div className="balance-header">
        <h3>Wallet Balance</h3>
        <span
          className="balance-status-badge"
          style={{ background: getStatusColor(wallet.status) }}
        >
          {getStatusIcon(wallet.status)} {wallet.status.toUpperCase()}
        </span>
      </div>

      <div className="balance-amount">
        <span className="currency">{wallet.currency}</span>
        <span className="amount">{wallet.balance.toFixed(2)}</span>
      </div>

      {showDetails && (
        <div className="balance-details">
          <div className="balance-detail-item">
            <span className="label">Total Earned:</span>
            <span className="value positive">
              {wallet.currency}{wallet.totalEarned.toFixed(2)}
            </span>
          </div>

          <div className="balance-detail-item">
            <span className="label">Total Spent:</span>
            <span className="value negative">
              {wallet.currency}{wallet.totalSpent.toFixed(2)}
            </span>
          </div>

          {wallet.totalWithdrawn > 0 && (
            <div className="balance-detail-item">
              <span className="label">Total Withdrawn:</span>
              <span className="value">
                {wallet.currency}{wallet.totalWithdrawn.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {wallet.lastTransactionAt && (
        <div className="balance-footer">
          <small>
            Last transaction: {new Date(wallet.lastTransactionAt).toLocaleString()}
          </small>
        </div>
      )}

      {wallet.status === 'frozen' && wallet.frozenReason && (
        <div className="balance-alert frozen">
          <strong>  Wallet Frozen:</strong> {wallet.frozenReason}
        </div>
      )}
    </div>
  );
};

export default BalanceCard;
