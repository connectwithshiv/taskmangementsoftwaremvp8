import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, CheckSquare, Edit2, Eye, Trash2, ChevronUp, ChevronDown, Save, X, Folder, Search, ArrowRight, ChevronDown as ChevronDownIcon } from 'lucide-react';
import ChecklistService from '../services/ChecklistService';
import CategoryService from '../services/categoryService';

/**
 * ChecklistItemEditor - Component to edit individual checklist items
 */
const ChecklistItemEditor = ({ item, index, totalItems, onUpdate, onDelete, onMove, isDarkMode }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl mb-3 shadow-sm hover:shadow-md transition-all duration-200 ${
      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`}>
      {/* Item Header */}
      <div className={`p-3 flex items-center gap-3 ${
        isDarkMode ? 'bg-slate-600' : 'bg-gradient-to-r from-blue-50 to-cyan-50'
      }`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isDarkMode ? 'hover:bg-slate-500' : 'hover:bg-white/80'
          }`}
        >
          {expanded ? <ChevronUp size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} /> : <ChevronDown size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />}
        </button>

        <CheckSquare size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />

        <div className={`text-sm font-semibold flex-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {item.text || `Item ${index + 1}`}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className={`p-2 rounded-lg disabled:opacity-30 transition-all duration-200 ${
              isDarkMode ? 'hover:bg-slate-500' : 'hover:bg-white/80'
            }`}
            title="Move up"
          >
            <ChevronUp size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === totalItems - 1}
            className={`p-2 rounded-lg disabled:opacity-30 transition-all duration-200 ${
              isDarkMode ? 'hover:bg-slate-500' : 'hover:bg-white/80'
            }`}
            title="Move down"
          >
            <ChevronDown size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
          <button onClick={onDelete} className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`} title="Delete">
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>

      {/* Item Content */}
      {expanded && (
        <div className={`p-4 space-y-3 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Checklist Item Text *</label>
            <input
              type="text"
              value={item.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'border-gray-300'
              }`}
              placeholder="e.g., Review code for bugs"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ChecklistPage - Checklist Builder
 */
const ChecklistPage = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [checklists, setChecklists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    categoryIds: [],
    items: []
  });

  // Category dropdown states
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    loadChecklists();
    loadCategories();
  }, []);

  const loadChecklists = () => {
    const allChecklists = ChecklistService.getAllChecklists();
    setChecklists(allChecklists);
  };

  const loadCategories = () => {
    try {
      const activeCategories = CategoryService.getActiveCategories();
      setCategories(activeCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const startNewChecklist = () => {
    setSelectedChecklist(null);
    setFormData({
      title: '',
      categoryIds: [],
      items: []
    });
    setShowCategoryDropdown(false);
    setExpandedNodes(new Set());
    setCategorySearch('');
    setActiveTab('edit');
  };

  const editChecklist = (checklist) => {
    setSelectedChecklist(checklist);
    // Support both old single categoryId and new categoryIds array
    const categoryIds = checklist.categoryIds || (checklist.categoryId ? [checklist.categoryId] : []);
    setFormData({
      title: checklist.title,
      categoryIds: categoryIds,
      items: [...(checklist.items || [])]
    });
    setShowCategoryDropdown(false);
    setExpandedNodes(new Set());
    setCategorySearch('');
    setActiveTab('edit');
  };

  const saveChecklist = () => {
    if (!formData.title) {
      alert('Please enter a checklist title');
      return;
    }
    if (!formData.categoryIds || formData.categoryIds.length === 0) {
      alert('Please select at least one category');
      return;
    }
    if (formData.items.length === 0) {
      alert('Please add at least one checklist item');
      return;
    }

    if (selectedChecklist) {
      const result = ChecklistService.updateChecklist(selectedChecklist.id, formData);
      if (result.success) {
        loadChecklists();
        setActiveTab('list');
        alert('Checklist updated successfully');
      } else {
        alert('Error: ' + result.message);
      }
    } else {
      const result = ChecklistService.createChecklist(formData);
      if (result.success) {
        loadChecklists();
        setActiveTab('list');
        alert('Checklist created successfully');
      } else {
        alert('Error: ' + result.message);
      }
    }
  };

  const deleteChecklist = (checklistId) => {
    if (confirm('Delete this checklist?')) {
      const result = ChecklistService.deleteChecklist(checklistId);
      if (result.success) {
        loadChecklists();
        alert('Checklist deleted');
      }
    }
  };

  const addItem = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      text: ''
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  const updateItem = (itemId, updates) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
    });
  };

  const deleteItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const moveItem = (itemId, direction) => {
    const index = formData.items.findIndex(item => item.id === itemId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.items.length) return;

    const newItems = [...formData.items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

    setFormData({ ...formData, items: newItems });
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
    { id: 'list', label: 'Checklists', icon: CheckSquare },
    { id: 'edit', label: selectedChecklist ? 'Edit Checklist' : 'New Checklist', icon: selectedChecklist ? Edit2 : Plus, hidden: activeTab !== 'edit' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Checklist Builder
        </h2>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create and manage checklists for task categories
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
                All Checklists ({checklists.length})
              </h3>
              <button
                onClick={startNewChecklist}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus size={18} /> New Checklist
              </button>
            </div>

            {checklists.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4">
                  <CheckSquare className={`mx-auto h-16 w-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <p className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No checklists yet</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Click "New Checklist" to create your first checklist</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checklists.map(checklist => {
                  const checklistCategoryIds = checklist.categoryIds || (checklist.categoryId ? [checklist.categoryId] : []);
                  const checklistCategories = checklistCategoryIds.map(id => categories.find(c => c.id === id)).filter(Boolean);
                  
                  return (
                    <div key={checklist.id} className={`border rounded-xl p-5 flex justify-between items-center hover:shadow-lg transition-all duration-200 group ${
                      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <h4 className={`font-bold mb-1 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{checklist.title}</h4>
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          {checklistCategories.length > 0 ? (
                            <>
                              {checklistCategories.slice(0, 3).map(cat => (
                                <span key={cat.id} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full font-medium">
                                  {cat.name}
                                </span>
                              ))}
                              {checklistCategories.length > 3 && (
                                <span className={`px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full font-medium ${isDarkMode ? 'from-gray-700 to-gray-800 text-gray-300' : ''}`}>
                                  +{checklistCategories.length - 3} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                              No Categories
                            </span>
                          )}
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {checklist.items?.length || 0} {checklist.items?.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editChecklist(checklist)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedChecklist(checklist);
                            setPreviewMode(true);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                        >
                          <Eye size={16} /> Preview
                        </button>
                        <button
                          onClick={() => deleteChecklist(checklist.id)}
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
            {previewMode && selectedChecklist && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                <div className={`rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl ${
                  isDarkMode ? 'bg-slate-800' : 'bg-white'
                }`}>
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-bold">{selectedChecklist.title}</h3>
                        <p className="text-blue-100 text-sm mt-1">Checklist Preview</p>
                      </div>
                      <button
                        onClick={() => setPreviewMode(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {(selectedChecklist.items || []).map((item, idx) => (
                      <div key={item.id || idx} className={`border rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-all duration-200 ${
                        isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                      }`}>
                        <CheckSquare size={20} className={`mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <p className={`font-medium flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === 'edit' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Checklist Info */}
            <div className={`rounded-xl p-6 shadow-sm border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Checklist Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Checklist Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Quality Assurance Checklist"
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
                          ? 'border-blue-500 bg-slate-700 ring-2 ring-blue-500 ring-opacity-30' 
                          : 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-30'
                        : isDarkMode
                          ? 'border-slate-600 bg-slate-700 hover:border-slate-500'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Folder size={18} className={showCategoryDropdown ? 'text-blue-500' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
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
                                  isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
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
                            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                            className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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

            {/* Checklist Items */}
            <div className={`rounded-xl p-6 shadow-sm border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center mb-5">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <CheckSquare size={20} className="text-blue-600" />
                  Checklist Items
                </h3>
                <button
                  onClick={addItem}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:from-blue-600 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Plus size={18} /> Add Item
                </button>
              </div>

              <div className="space-y-2">
                {formData.items.length === 0 ? (
                  <div className={`text-center py-12 border-2 border-dashed rounded-xl ${
                    isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="mb-3">
                      <CheckSquare className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>
                    <p className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No items yet</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Click "Add Item" to create your first checklist item</p>
                  </div>
                ) : (
                  formData.items.map((item, idx) => (
                    <ChecklistItemEditor
                      key={item.id}
                      item={item}
                      index={idx}
                      totalItems={formData.items.length}
                      onUpdate={(updates) => updateItem(item.id, updates)}
                      onDelete={() => deleteItem(item.id)}
                      onMove={(direction) => moveItem(item.id, direction)}
                      isDarkMode={isDarkMode}
                    />
                  ))
                )}
              </div>
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
                onClick={saveChecklist}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Save size={18} /> Save Checklist
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
          background: ${isDarkMode ? '#3b82f6' : '#2563eb'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#2563eb' : '#1d4ed8'};
        }
      `}</style>
    </div>
  );
};

export default ChecklistPage;

