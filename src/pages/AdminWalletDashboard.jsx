import React, { useState, useEffect } from 'react';
import walletService from '../services/walletService';
import userService from '../services/userService';
import '../components/wallet/Wallet.css';
import './AdminWalletDashboard.css';

const AdminWalletDashboard = () => {
  const [combinedBalance, setCombinedBalance] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('balance'); // balance, earned, name
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    loadCombinedBalance();
  }, [roleFilter, statusFilter]);

  const loadCombinedBalance = () => {
    const filters = {
      status: statusFilter || undefined
    };

    const combined = walletService.getCombinedBalance(filters);

    // Enhance with user information
    const users = userService.getAllUsers();
    const enhancedUserBreakdown = combined.userBreakdown.map(item => {
      const user = users.find(u => u.user_id === item.userId);
      return {
        ...item,
        userName: user?.username || 'Unknown',
        userEmail: user?.email || '',
        userRole: user?.role_name || '',
        userRoleId: user?.role_id || 0
      };
    });

    setCombinedBalance({
      ...combined,
      userBreakdown: enhancedUserBreakdown
    });
  };

  const getFilteredAndSortedUsers = () => {
    if (!combinedBalance) return [];

    let users = [...combinedBalance.userBreakdown];

    // Apply role filter
    if (roleFilter) {
      const roleId = parseInt(roleFilter);
      users = users.filter(user => user.userRoleId === roleId);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(user =>
        user.userName.toLowerCase().includes(query) ||
        user.userEmail.toLowerCase().includes(query) ||
        user.userId.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    users.sort((a, b) => {
      let compareA, compareB;

      switch (sortBy) {
        case 'balance':
          compareA = a.wallet.balance;
          compareB = b.wallet.balance;
          break;
        case 'earned':
          compareA = a.wallet.totalEarned;
          compareB = b.wallet.totalEarned;
          break;
        case 'name':
          compareA = a.userName.toLowerCase();
          compareB = b.userName.toLowerCase();
          break;
        default:
          compareA = a.wallet.balance;
          compareB = b.wallet.balance;
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    return users;
  };

  const toggleSortOrder = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const calculateFilteredTotals = () => {
    const filteredUsers = getFilteredAndSortedUsers();

    return {
      totalUsers: filteredUsers.length,
      totalBalance: filteredUsers.reduce((sum, user) => sum + user.wallet.balance, 0),
      totalEarned: filteredUsers.reduce((sum, user) => sum + user.wallet.totalEarned, 0),
      totalSpent: filteredUsers.reduce((sum, user) => sum + user.wallet.totalSpent, 0)
    };
  };

  if (!combinedBalance) {
    return (
      <div className="admin-wallet-dashboard">
        <h2>Combined Wallet Balance</h2>
        <p>Loading...</p>
      </div>
    );
  }

  const filteredUsers = getFilteredAndSortedUsers();
  const filteredTotals = calculateFilteredTotals();

  return (
    <div className="admin-wallet-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Combined Wallet Balance</h2>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            View and manage wallet balances across all users
          </p>
        </div>
        <div className="dashboard-refresh">
          <button onClick={loadCombinedBalance} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Total Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h4>Total Users</h4>
            <div className="stat-value">{filteredTotals.totalUsers}</div>
          </div>
        </div>

        <div className="dashboard-stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h4>Total Balance</h4>
            <div className="stat-value">
              ₹{filteredTotals.totalBalance.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card info">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>Total Earned</h4>
            <div className="stat-value">
              ₹{filteredTotals.totalEarned.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card warning">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h4>Total Spent</h4>
            <div className="stat-value">
              ₹{filteredTotals.totalSpent.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Role:</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="1">Admin</option>
            <option value="2">Doer</option>
            <option value="3">Checker</option>
            <option value="4">Trainer</option>
            <option value="5">Team Leader</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="filter-group search">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* User Wallets Table */}
      <div className="dashboard-table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th onClick={() => toggleSortOrder('name')} className="sortable">
                User {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Role</th>
              <th onClick={() => toggleSortOrder('balance')} className="sortable">
                Balance {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => toggleSortOrder('earned')} className="sortable">
                Total Earned {sortBy === 'earned' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Total Spent</th>
              <th>Transactions</th>
              <th>Status</th>
              <th>Last Transaction</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  <div>No users found matching the filters</div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <div className="user-cell">
                      <div className="user-name">{user.userName}</div>
                      <div className="user-email">{user.userEmail}</div>
                      <div className="user-id">{user.userId}</div>
                    </div>
                  </td>

                  <td>
                    <span className={`role-badge role-${user.userRoleId}`}>
                      {user.userRole}
                    </span>
                  </td>

                  <td>
                    <div className="amount-cell">
                      <strong>₹{user.wallet.balance.toFixed(2)}</strong>
                    </div>
                  </td>

                  <td>
                    <div className="amount-cell positive">
                      ₹{user.wallet.totalEarned.toFixed(2)}
                    </div>
                  </td>

                  <td>
                    <div className="amount-cell negative">
                      ₹{user.wallet.totalSpent.toFixed(2)}
                    </div>
                  </td>

                  <td>
                    <div className="transaction-count">
                      {user.transactionCount}
                    </div>
                  </td>

                  <td>
                    <span className={`wallet-status-badge ${user.wallet.status}`}>
                      {user.wallet.status}
                    </span>
                  </td>

                  <td>
                    <div className="last-transaction">
                      {user.wallet.lastTransactionAt
                        ? new Date(user.wallet.lastTransactionAt).toLocaleDateString()
                        : '-'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="dashboard-footer">
        <p>
          Showing {filteredUsers.length} of {combinedBalance.totalUsers} users
          {' • '}
          Last calculated: {new Date(combinedBalance.calculatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default AdminWalletDashboard;
