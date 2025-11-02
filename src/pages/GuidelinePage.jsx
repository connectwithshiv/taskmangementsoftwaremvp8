import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, FileText, Edit2, Eye, Trash2, ChevronUp, ChevronDown, Save, X, Folder, Search, ArrowRight, ChevronDown as ChevronDownIcon } from 'lucide-react';
import GuidelineService from '../services/GuidelineService';
import CategoryService from '../services/categoryService';

/**
 * GuidelinePage - Guidelines Builder with rich text editor
 */
const GuidelinePage = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [guidelines, setGuidelines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    categoryIds: [],
    content: ''
  });

  // Category dropdown states
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    loadGuidelines();
    loadCategories();
  }, []);

  const loadGuidelines = () => {
    const allGuidelines = GuidelineService.getAllGuidelines();
    setGuidelines(allGuidelines);
  };

  const loadCategories = () => {
    try {
      const activeCategories = CategoryService.getActiveCategories();
      setCategories(activeCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const startNewGuideline = () => {
    setSelectedGuideline(null);
    setFormData({
      title: '',
      categoryIds: [],
      content: ''
    });
    setShowCategoryDropdown(false);
    setExpandedNodes(new Set());
    setCategorySearch('');
    setActiveTab('edit');
  };

  const editGuideline = (guideline) => {
    setSelectedGuideline(guideline);
    // Support both old single categoryId and new categoryIds array
    const categoryIds = guideline.categoryIds || (guideline.categoryId ? [guideline.categoryId] : []);
    setFormData({
      title: guideline.title,
      categoryIds: categoryIds,
      content: guideline.content || ''
    });
    setShowCategoryDropdown(false);
    setExpandedNodes(new Set());
    setCategorySearch('');
    setActiveTab('edit');
  };

  const saveGuideline = () => {
    if (!formData.title) {
      alert('Please enter a guideline title');
      return;
    }
    if (!formData.categoryIds || formData.categoryIds.length === 0) {
      alert('Please select at least one category');
      return;
    }
    if (!formData.content || formData.content.trim() === '') {
      alert('Please enter guideline content');
      return;
    }

    if (selectedGuideline) {
      const result = GuidelineService.updateGuideline(selectedGuideline.id, formData);
      if (result.success) {
        loadGuidelines();
        setActiveTab('list');
        alert('Guideline updated successfully');
      } else {
        alert('Error: ' + result.message);
      }
    } else {
      const result = GuidelineService.createGuideline(formData);
      if (result.success) {
        loadGuidelines();
        setActiveTab('list');
        alert('Guideline created successfully');
      } else {
        alert('Error: ' + result.message);
      }
    }
  };

  const deleteGuideline = (guidelineId) => {
    if (confirm('Delete this guideline?')) {
      const result = GuidelineService.deleteGuideline(guidelineId);
      if (result.success) {
        loadGuidelines();
        alert('Guideline deleted');
      }
    }
  };

  // ==========================================
  // HIERARCHICAL CATEGORY DROPDOWN FUNCTIONS
  // ==========================================

  // Build category tree structure
  const categoryTree = useMemo(() => {
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
    };
    return buildTree(null);
  }, [categories]);

  // Toggle node expansion
  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  // Filter categories based on search
  const filterTree = (tree, searchTerm) => {
    if (!searchTerm.trim()) return tree;

    const term = searchTerm.toLowerCase();
    const filtered = tree
      .filter(cat => 
        cat.name.toLowerCase().includes(term) ||
        cat.categoryId?.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term))
      )
      .map(cat => ({
        ...cat,
        children: filterTree(cat.children, searchTerm)
      }));

    // Also include parents of matching items
    const addParents = (trees) => {
      return trees.map(cat => {
        const childrenWithParents = addParents(cat.children);
        return {
          ...cat,
          children: childrenWithParents
        };
      });
    };

    return addParents(filtered);
  };

  const visibleTree = filterTree(categoryTree, categorySearch);

  // Auto-expand when searching
  useEffect(() => {
    if (categorySearch.trim()) {
      const getAllIds = (tree) => {
        let ids = new Set();
        tree.forEach(cat => {
          ids.add(cat.id);
          getAllIds(cat.children).forEach(id => ids.add(id));
        });
        return ids;
      };
      setExpandedNodes(getAllIds(visibleTree));
    }
  }, [categorySearch, visibleTree]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    const selected = new Set(formData.categoryIds);
    if (selected.has(categoryId)) {
      selected.delete(categoryId);
    } else {
      selected.add(categoryId);
    }
    setFormData({
      ...formData,
      categoryIds: Array.from(selected)
    });
  };

  // Get checkbox state
  const getCheckboxState = (categoryId) => {
    const selected = new Set(formData.categoryIds);
    const isSelected = selected.has(categoryId);
    
    if (isSelected) return 'checked';
    
    const getDescendants = (id) => {
      const descendants = [];
      const children = categories.filter(cat => cat.parentId === id);
      children.forEach(child => {
        descendants.push(child.id);
        descendants.push(...getDescendants(child.id));
      });
      return descendants;
    };
    
    const descendants = getDescendants(categoryId);
    const someSelected = descendants.some(id => selected.has(id));
    
    if (someSelected) return 'indeterminate';
    return 'unchecked';
  };

  // Render category tree node
  const renderTreeNode = (cat, depth = 0) => {
    const isSelected = formData.categoryIds.includes(cat.id);
    const isExpanded = expandedNodes.has(cat.id);
    const hasChildren = cat.children && cat.children.length > 0;
    const checkboxState = getCheckboxState(cat.id);

    return (
      <div key={cat.id} className="select-none">
        <label
          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
            isSelected
              ? isDarkMode 
                ? 'bg-blue-900/40 hover:bg-blue-900/50 border-2 border-blue-500' 
                : 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-300'
              : checkboxState === 'indeterminate'
                ? isDarkMode
                  ? 'bg-indigo-900/20 hover:bg-indigo-900/30 border-2 border-indigo-400'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-300'
                : isDarkMode
                  ? 'hover:bg-gray-600 border-2 border-transparent'
                  : 'hover:bg-gray-50 border-2 border-transparent'
          }`}
          style={{ marginLeft: `${depth * 12}px` }}
        >
          {/* Expansion toggle */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(cat.id);
              }}
              className="pt-0.5 hover:opacity-70 transition-opacity"
            >
              {isExpanded ? (
                <ChevronDownIcon size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              ) : (
                <ArrowRight size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              )}
            </button>
          )}
          
          {/* Spacing for leaf nodes */}
          {!hasChildren && <div className="w-5" />}

          {/* Checkbox */}
          <div className="pt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleCategoryToggle(cat.id)}
              className="w-4 h-4"
            />
          </div>

          {/* Category info */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {cat.name}
            </div>
            <div className={`text-xs mt-1 flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {cat.categoryId && (
                <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                  isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {cat.categoryId}
                </span>
              )}
              {hasChildren && (
                <span className="text-xs">
                  ({cat.children.length} subcategories)
                </span>
              )}
            </div>
          </div>
        </label>

        {/* Child categories */}
        {hasChildren && isExpanded && (
          <div className={`ml-2 border-l-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            {cat.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'list', label: 'Guidelines', icon: FileText },
    { id: 'edit', label: selectedGuideline ? 'Edit Guideline' : 'New Guideline', icon: selectedGuideline ? Edit2 : Plus, hidden: activeTab !== 'edit' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Guidelines Builder
        </h2>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create and manage guidelines for task categories
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b mb-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.filter(tab => !tab.hidden).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-medium transition border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? 'border-blue-500 text-blue-400 bg-slate-800/50'
                      : 'border-blue-600 text-blue-600 bg-blue-50'
                    : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-slate-800/30'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                All Guidelines ({guidelines.length})
              </h3>
              <button
                onClick={startNewGuideline}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus size={18} /> New Guideline
              </button>
            </div>

            {guidelines.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4">
                  <svg className={`mx-auto h-16 w-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No guidelines yet</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Click "New Guideline" to create your first guideline</p>
              </div>
            ) : (
              <div className="space-y-3">
                {guidelines.map(guideline => {
                  const guidelineCategoryIds = guideline.categoryIds || (guideline.categoryId ? [guideline.categoryId] : []);
                  const guidelineCategories = guidelineCategoryIds.map(id => categories.find(c => c.id === id)).filter(Boolean);
                  
                  return (
                    <div key={guideline.id} className={`border rounded-xl p-5 flex justify-between items-center hover:shadow-lg transition-all duration-200 group ${
                      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <h4 className={`font-bold mb-1 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{guideline.title}</h4>
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          {guidelineCategories.length > 0 ? (
                            <>
                              {guidelineCategories.slice(0, 3).map(cat => (
                                <span key={cat.id} className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full font-medium">
                                  {cat.name}
                                </span>
                              ))}
                              {guidelineCategories.length > 3 && (
                                <span className={`px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full font-medium ${isDarkMode ? 'from-gray-700 to-gray-800 text-gray-300' : ''}`}>
                                  +{guidelineCategories.length - 3} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                              No Categories
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editGuideline(guideline)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGuideline(guideline);
                            setPreviewMode(true);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Eye size={16} /> Preview
                        </button>
                        <button
                          onClick={() => deleteGuideline(guideline.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Preview Modal */}
            {previewMode && selectedGuideline && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                <div className={`rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl ${
                  isDarkMode ? 'bg-slate-800' : 'bg-white'
                }`}>
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-bold">{selectedGuideline.title}</h3>
                        <p className="text-green-100 text-sm mt-1">Guideline Preview</p>
                      </div>
                      <button
                        onClick={() => setPreviewMode(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                      <pre className={`whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                        {selectedGuideline.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === 'edit' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Guideline Info */}
            <div className={`rounded-xl p-6 shadow-sm border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Guideline Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Guideline Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Coding Standards"
                  />
                </div>

                <div className="relative" ref={categoryDropdownRef}>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Categories * <span className="text-xs font-normal">(Select multiple)</span>
                  </label>
                  
                  {/* Category Selector Button */}
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`w-full px-4 py-3 border-2 rounded-lg flex items-center justify-between transition-all text-left ${
                      showCategoryDropdown 
                        ? isDarkMode 
                          ? 'border-green-500 bg-slate-700 ring-2 ring-green-500 ring-opacity-30' 
                          : 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-30'
                        : isDarkMode
                          ? 'border-slate-600 bg-slate-700 hover:border-slate-500'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Folder size={18} className={showCategoryDropdown ? 'text-green-500' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                      <div className="flex-1 min-w-0">
                        {formData.categoryIds.length === 0 ? (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Select categories...
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {formData.categoryIds.slice(0, 2).map(id => {
                              const cat = categories.find(c => c.id === id);
                              return cat ? (
                                <span key={id} className={`px-2 py-1 rounded text-xs font-medium ${
                                  isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'
                                }`}>
                                  {cat.name}
                                </span>
                              ) : null;
                            })}
                            {formData.categoryIds.length > 2 && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-700'
                              }`}>
                                +{formData.categoryIds.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {showCategoryDropdown ? <ChevronDownIcon size={20} /> : <ChevronDownIcon size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />}
                  </button>

                  {/* Category Tree Dropdown */}
                  {showCategoryDropdown && (
                    <div className={`absolute z-50 w-full mt-2 rounded-lg shadow-2xl border-2 ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
                    }`}>
                      {/* Search Bar */}
                      <div className={`p-3 border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                        <div className="relative">
                          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                          <input
                            type="text"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder="Search categories..."
                            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                              isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                          {categorySearch && (
                            <button
                              type="button"
                              onClick={() => setCategorySearch('')}
                              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Category Tree */}
                      <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                        {visibleTree.length === 0 ? (
                          <div className="p-8 text-center">
                            <Folder size={48} className={`mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {categorySearch ? 'No categories match your search' : 'No categories available'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            {visibleTree.map(cat => renderTreeNode(cat))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className={`p-3 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-600 bg-slate-750' : 'border-gray-200 bg-gray-50'}`}>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formData.categoryIds.length} categories selected
                        </span>
                        <div className="flex gap-2">
                          {formData.categoryIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, categoryIds: [] })}
                              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              Clear All
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(false)}
                            className="px-4 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className={`rounded-xl p-6 shadow-sm border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Guideline Content *
              </h3>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'border-gray-300 placeholder-gray-400'
                }`}
                rows="20"
                placeholder="Enter your guideline content here. You can paste large amounts of text, add formatting, and structure your guidelines...&#10;&#10;Example:&#10;&#10;1. Coding Standards&#10;   - Always use meaningful variable names&#10;   - Follow the DRY principle&#10;&#10;2. Documentation&#10;   - Comment complex logic&#10;   - Keep README updated"
              />
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ℹ️ You can paste or type large amounts of text. Use line breaks and indentation for formatting.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveGuideline}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Save size={18} /> Save Guideline
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#f1f5f9'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#10b981' : '#059669'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#059669' : '#047857'};
        }
      `}</style>
    </div>
  );
};

export default GuidelinePage;

