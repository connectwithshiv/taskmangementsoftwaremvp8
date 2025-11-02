import React, { useState, useEffect } from 'react';
import rateManagerService from '../../services/rateManagerService';
import categoryService from '../../services/categoryService';
import './RateManager.css';

const RateManagerForm = ({ rateConfig, onSave, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    categoryId: '',
    categoryName: '',
    categoryPath: '',

    // Doer rate
    doerUsesCategoryAmount: true,
    doerAmount: 0,
    doerCurrency: '₹',

    // Checker rate
    checkerPercentagePerMistake: 1,
    checkerMaxMistakes: 100,
    checkerMinEarning: 0,
    checkerCurrency: '₹',

    // Metadata
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load categories
    const allCategories = categoryService.getAllCategories();
    setCategories(allCategories);

    // If editing, populate form
    if (rateConfig) {
      setFormData({
        categoryId: rateConfig.categoryId || '',
        categoryName: rateConfig.categoryName || '',
        categoryPath: rateConfig.categoryPath || '',
        doerUsesCategoryAmount: rateConfig.doerRate?.usesCategoryAmount !== false,
        doerAmount: rateConfig.doerRate?.amount || 0,
        doerCurrency: rateConfig.doerRate?.currency || '₹',
        checkerPercentagePerMistake: rateConfig.checkerRate?.percentagePerMistake || 1,
        checkerMaxMistakes: rateConfig.checkerRate?.maxMistakes || 100,
        checkerMinEarning: rateConfig.checkerRate?.minEarning || 0,
        checkerCurrency: rateConfig.checkerRate?.currency || '₹',
        effectiveFrom: rateConfig.effectiveFrom?.split('T')[0] || new Date().toISOString().split('T')[0],
        effectiveTo: rateConfig.effectiveTo?.split('T')[0] || '',
        isActive: rateConfig.isActive !== false,
      });
    }
  }, [rateConfig]);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const category = categories.find(c => c.id === categoryId);

    if (category) {
      setFormData({
        ...formData,
        categoryId: category.id,
        categoryName: category.name,
        categoryPath: category.path || category.name,
        doerAmount: parseFloat(category.amount || 0)
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (formData.checkerPercentagePerMistake < 0 || formData.checkerPercentagePerMistake > 100) {
      newErrors.checkerPercentagePerMistake = 'Percentage must be between 0 and 100';
    }

    if (formData.checkerMaxMistakes < 1) {
      newErrors.checkerMaxMistakes = 'Max mistakes must be at least 1';
    }

    if (formData.effectiveFrom && formData.effectiveTo) {
      if (new Date(formData.effectiveFrom) > new Date(formData.effectiveTo)) {
        newErrors.effectiveTo = 'Effective To date must be after Effective From date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const rateData = {
      id: rateConfig?.id,
      categoryId: formData.categoryId,
      categoryName: formData.categoryName,
      categoryPath: formData.categoryPath,
      doerRate: {
        amount: parseFloat(formData.doerAmount || 0),
        currency: formData.doerCurrency,
        usesCategoryAmount: formData.doerUsesCategoryAmount
      },
      checkerRate: {
        percentagePerMistake: parseFloat(formData.checkerPercentagePerMistake || 0),
        currency: formData.checkerCurrency,
        maxMistakes: parseInt(formData.checkerMaxMistakes || 100),
        minEarning: parseFloat(formData.checkerMinEarning || 0)
      },
      effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).toISOString() : new Date().toISOString(),
      effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo).toISOString() : null,
      isActive: formData.isActive,
      createdBy: rateConfig?.createdBy || 'admin',
      updatedBy: 'admin'
    };

    const result = rateManagerService.setRate(rateData);

    if (result.success) {
      onSave(result.rate);
    } else {
      alert('Error saving rate: ' + result.error);
    }
  };

  // Get selected category to show amount
  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  return (
    <div className="rate-manager-form">
      <h3>{rateConfig ? 'Edit Rate Configuration' : 'Add Rate Configuration'}</h3>

      <form onSubmit={handleSubmit}>
        {/* Category Selection */}
        <div className="form-section">
          <h4>Category</h4>

          <div className="form-group">
            <label htmlFor="categoryId">Select Category *</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className={errors.categoryId ? 'error' : ''}
              disabled={!!rateConfig}
            >
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.path || cat.name} {cat.amount ? `(${cat.amount})` : ''}
                </option>
              ))}
            </select>
            {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
          </div>

          {selectedCategory && (
            <div className="category-info">
              <p><strong>Category Amount:</strong> ₹{selectedCategory.amount || 0}</p>
              {selectedCategory.description && (
                <p><strong>Description:</strong> {selectedCategory.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Doer Rate Configuration */}
        <div className="form-section">
          <h4>Doer Rate Configuration</h4>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="doerUsesCategoryAmount"
                checked={formData.doerUsesCategoryAmount}
                onChange={handleInputChange}
              />
              Use category amount for doer earning
            </label>
          </div>

          {!formData.doerUsesCategoryAmount && (
            <div className="form-group">
              <label htmlFor="doerAmount">Custom Doer Amount</label>
              <input
                type="number"
                id="doerAmount"
                name="doerAmount"
                value={formData.doerAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>

        {/* Checker Rate Configuration */}
        <div className="form-section">
          <h4>Checker Rate Configuration</h4>

          <div className="form-group">
            <label htmlFor="checkerPercentagePerMistake">Percentage Per Mistake (%) *</label>
            <input
              type="number"
              id="checkerPercentagePerMistake"
              name="checkerPercentagePerMistake"
              value={formData.checkerPercentagePerMistake}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              className={errors.checkerPercentagePerMistake ? 'error' : ''}
            />
            {errors.checkerPercentagePerMistake && (
              <span className="error-message">{errors.checkerPercentagePerMistake}</span>
            )}
            <small>Checker will earn this percentage of category amount per mistake found</small>
          </div>

          <div className="form-group">
            <label htmlFor="checkerMaxMistakes">Maximum Mistakes to Count</label>
            <input
              type="number"
              id="checkerMaxMistakes"
              name="checkerMaxMistakes"
              value={formData.checkerMaxMistakes}
              onChange={handleInputChange}
              min="1"
              className={errors.checkerMaxMistakes ? 'error' : ''}
            />
            {errors.checkerMaxMistakes && (
              <span className="error-message">{errors.checkerMaxMistakes}</span>
            )}
            <small>Maximum number of mistakes that will be counted for earning calculation</small>
          </div>

          <div className="form-group">
            <label htmlFor="checkerMinEarning">Minimum Earning (₹)</label>
            <input
              type="number"
              id="checkerMinEarning"
              name="checkerMinEarning"
              value={formData.checkerMinEarning}
              onChange={handleInputChange}
              min="0"
              step="0.01"
            />
            <small>Minimum amount checker will earn per review</small>
          </div>

          {/* Earning Preview */}
          {selectedCategory && selectedCategory.amount > 0 && (
            <div className="earning-preview">
              <h5>Earning Examples:</h5>
              <ul>
                <li>
                  <strong>1 mistake:</strong> ₹
                  {((selectedCategory.amount * formData.checkerPercentagePerMistake * 1) / 100).toFixed(2)}
                </li>
                <li>
                  <strong>3 mistakes:</strong> ₹
                  {((selectedCategory.amount * formData.checkerPercentagePerMistake * 3) / 100).toFixed(2)}
                </li>
                <li>
                  <strong>5 mistakes:</strong> ₹
                  {((selectedCategory.amount * formData.checkerPercentagePerMistake * 5) / 100).toFixed(2)}
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Effective Dates */}
        <div className="form-section">
          <h4>Effective Dates</h4>

          <div className="form-group">
            <label htmlFor="effectiveFrom">Effective From</label>
            <input
              type="date"
              id="effectiveFrom"
              name="effectiveFrom"
              value={formData.effectiveFrom}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="effectiveTo">Effective To (Optional)</label>
            <input
              type="date"
              id="effectiveTo"
              name="effectiveTo"
              value={formData.effectiveTo}
              onChange={handleInputChange}
              className={errors.effectiveTo ? 'error' : ''}
            />
            {errors.effectiveTo && (
              <span className="error-message">{errors.effectiveTo}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              Rate is active
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {rateConfig ? 'Update Rate' : 'Add Rate'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RateManagerForm;
