import React, { useState, useEffect } from 'react';
import rateManagerService from '../services/rateManagerService';
import RateManagerForm from '../components/ratemanager/RateManagerForm';
import '../components/ratemanager/RateManager.css';

const RateManagerPage = () => {
  const [rates, setRates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadRates();
    loadStats();
  }, []);

  const loadRates = () => {
    const allRates = rateManagerService.getRates();
    setRates(allRates);
  };

  const loadStats = () => {
    const rateStats = rateManagerService.getRateStats();
    setStats(rateStats);
  };

  const handleAddRate = () => {
    setEditingRate(null);
    setShowForm(true);
  };

  const handleEditRate = (rate) => {
    setEditingRate(rate);
    setShowForm(true);
  };

  const handleDeleteRate = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this rate configuration?')) {
      const result = rateManagerService.deleteRate(categoryId);
      if (result.success) {
        loadRates();
        loadStats();
      }
    }
  };

  const handleSaveRate = (rate) => {
    setShowForm(false);
    setEditingRate(null);
    loadRates();
    loadStats();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRate(null);
  };

  const getRateStatus = (rate) => {
    if (!rate.isActive) return 'inactive';

    const now = new Date();
    if (rate.effectiveFrom && new Date(rate.effectiveFrom) > now) {
      return 'inactive';
    }
    if (rate.effectiveTo && new Date(rate.effectiveTo) < now) {
      return 'expired';
    }

    return 'active';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="rate-manager-container">
      {/* Header */}
      <div className="rate-manager-header">
        <div>
          <h2>Rate Manager</h2>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            Manage category-wise earning rates for doers and checkers
          </p>
        </div>
        <button className="btn-primary" onClick={handleAddRate}>
          + Add Rate Configuration
        </button>
      </div>

      {/* Statistics */}
      <div className="rate-manager-stats">
        <div className="stat-card">
          <h4>Total Rate Configurations</h4>
          <div className="value">{stats.totalRates || 0}</div>
        </div>

        <div className="stat-card">
          <h4>Active Rates</h4>
          <div className="value">{stats.activeRates || 0}</div>
        </div>

        <div className="stat-card secondary">
          <h4>Inactive Rates</h4>
          <div className="value">{stats.inactiveRates || 0}</div>
        </div>

        <div className="stat-card secondary">
          <h4>Average Checker Rate</h4>
          <div className="value">{stats.averageCheckerRate?.toFixed(2) || 0}%</div>
        </div>
      </div>

      {/* Rate List */}
      {!showForm && (
        <div className="rate-list-container">
          {rates.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
              <h3>No Rate Configurations Yet</h3>
              <p>Create your first rate configuration to start managing earnings</p>
              <button className="btn-primary" onClick={handleAddRate}>
                + Add Rate Configuration
              </button>
            </div>
          ) : (
            <table className="rate-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Doer Rate</th>
                  <th>Checker Rate</th>
                  <th>Effective Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => {
                  const status = getRateStatus(rate);
                  return (
                    <tr key={rate.id}>
                      <td>
                        <div>
                          <strong>{rate.categoryName}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {rate.categoryPath}
                        </div>
                      </td>

                      <td>
                        <div className="rate-details">
                          {rate.doerRate.usesCategoryAmount ? (
                            <span>Uses Category Amount</span>
                          ) : (
                            <span>
                              <span className="label">{rate.doerRate.currency}</span>
                              {rate.doerRate.amount}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="rate-details">
                          <div>
                            <span className="label">Per Mistake:</span>{' '}
                            {rate.checkerRate.percentagePerMistake}%
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Max: {rate.checkerRate.maxMistakes} mistakes
                          </div>
                          {rate.checkerRate.minEarning > 0 && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Min: {rate.checkerRate.currency}{rate.checkerRate.minEarning}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px' }}>
                          <div>
                            <strong>From:</strong> {formatDate(rate.effectiveFrom)}
                          </div>
                          <div>
                            <strong>To:</strong> {formatDate(rate.effectiveTo)}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`rate-status ${status}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <div className="rate-actions">
                          <button
                            className="btn-icon edit"
                            onClick={() => handleEditRate(rate)}
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeleteRate(rate.categoryId)}
                            title="Delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancelForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RateManagerForm
              rateConfig={editingRate}
              onSave={handleSaveRate}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RateManagerPage;
