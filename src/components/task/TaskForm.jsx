// // components/TaskForm.jsx - Complete Task Form with ID Resolver

// import React, { useState, useEffect } from 'react';
// import { X, Save, AlertCircle } from 'lucide-react';
// import UserIdResolver from '../user/UserIdResolver';
// const TaskForm = ({ 
//   task = null, 
//   categories = [], 
//   users = [],
//   onSubmit, 
//   onCancel,
//   isEdit = false 
// }) => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     categoryId: '',
//     assignedTo: '',
//     priority: 'medium',
//     status: 'pending',
//     dueDate: '',
//     estimatedHours: '',
//     tags: ''
//   });

//   const [errors, setErrors] = useState({});
//   const [eligibleUsers, setEligibleUsers] = useState([]);

//   // Initialize form with task data if editing
//   useEffect(() => {
//     if (task) {
//       setFormData({
//         title: task.title || '',
//         description: task.description || '',
//         categoryId: task.categoryId || '',
//         assignedTo: task.assignedTo || '',
//         priority: task.priority || 'medium',
//         status: task.status || 'pending',
//         dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
//         estimatedHours: task.estimatedHours || '',
//         tags: task.tags?.join(', ') || ''
//       });
//     }
//   }, [task]);

//   // ✅ Update eligible users when category changes - WITH ID RESOLVER
//   useEffect(() => {
//     if (formData.categoryId) {
//       const eligible = users.filter(user => {
//         if (user.status !== 'active') return false;
//         if (!user.assigned_category_ids) return false;
        
//         // Check if user has 'all' categories access
//         if (user.assigned_category_ids.includes('all')) return true;
        
//         // Check if user is assigned to this category
//         return user.assigned_category_ids.includes(formData.categoryId);
//       });
      
//       console.log('📋 Eligible users for category:', formData.categoryId, eligible.length);
//       setEligibleUsers(eligible);
      
//       // ✅ Clear assigned user if not eligible (using ID resolver)
//       if (formData.assignedTo) {
//         const isStillEligible = eligible.some(u => {
//           const userId = UserIdResolver.getUserId(u);
//           return String(userId) === String(formData.assignedTo);
//         });
        
//         if (!isStillEligible) {
//           console.log('⚠️ Previously selected user not eligible, clearing selection');
//           setFormData(prev => ({ ...prev, assignedTo: '' }));
//         }
//       }
//     } else {
//       setEligibleUsers([]);
//       setFormData(prev => ({ ...prev, assignedTo: '' }));
//     }
//   }, [formData.categoryId, users]);

//   // Get category full path
//   const getCategoryPath = (categoryId) => {
//     const category = categories.find(c => c.id === categoryId);
//     if (!category) return '';
    
//     const getParentChain = (cat) => {
//       const chain = [cat.name];
//       let currentId = cat.parentId;
//       while (currentId) {
//         const parent = categories.find(c => c.id === currentId);
//         if (!parent) break;
//         chain.unshift(parent.name);
//         currentId = parent.parentId;
//       }
//       return chain.join(' > ');
//     };
    
//     return getParentChain(category);
//   };

//   // Validate form
//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!formData.title.trim()) {
//       newErrors.title = 'Title is required';
//     }
    
//     if (!formData.categoryId) {
//       newErrors.categoryId = 'Category is required';
//     }
    
//     if (!formData.assignedTo) {
//       newErrors.assignedTo = 'Assigned user is required';
//     }
    
//     if (formData.estimatedHours && (isNaN(formData.estimatedHours) || formData.estimatedHours < 0)) {
//       newErrors.estimatedHours = 'Please enter a valid number';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // ✅ Handle form submission - WITH ID RESOLVER
//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }

//     console.log('=== TASK FORM SUBMISSION (ID RESOLVER) ===');
//     console.log('Form assignedTo value:', formData.assignedTo);
    
//     // ✅ Find selected user using ID resolver
//     const selectedUser = UserIdResolver.findUserById(users, formData.assignedTo);
    
//     if (!selectedUser) {
//       console.error('❌ ERROR: No user found with ID:', formData.assignedTo);
//       console.error('Available users:', users.map(u => ({
//         id: u.id,
//         user_id: u.user_id,
//         username: u.username,
//         canonicalId: UserIdResolver.getUserId(u)
//       })));
//       alert('Error: Selected user not found. Please try again.');
//       return;
//     }
    
//     // ✅ Get canonical user ID using resolver
//     const assignedToId = UserIdResolver.getUserId(selectedUser);
//     const assignedToName = selectedUser.name || selectedUser.username;
    
//     console.log('✅ Selected user:', {
//       username: selectedUser.username,
//       canonicalId: assignedToId,
//       allIds: UserIdResolver.getAllUserIds(selectedUser)
//     });
    
//     const taskData = {
//       title: formData.title,
//       description: formData.description,
//       categoryId: formData.categoryId,
//       categoryPath: getCategoryPath(formData.categoryId),
//       assignedTo: assignedToId,  // ✅ Use canonical ID
//       assignedToName: assignedToName, // ✅ Use name for display
//       priority: formData.priority,
//       status: formData.status,
//       estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
//       tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
//       dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
//     };
    
//     console.log('✅ Final task data:', {
//       title: taskData.title,
//       assignedTo: taskData.assignedTo,
//       assignedToName: taskData.assignedToName,
//       categoryPath: taskData.categoryPath
//     });
//     console.log('==========================================');

//     onSubmit(taskData);
//   };

//   const handleChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
    
//     // Clear error for this field
//     if (errors[field]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
//           <h2 className="text-2xl font-bold text-gray-800">
//             {isEdit ? 'Edit Task' : 'Create New Task'}
//           </h2>
//           <button
//             onClick={onCancel}
//             className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X size={24} />
//           </button>
//         </div>
        
//         {/* Form */}
//         <div className="p-6">
//           <div className="space-y-5">
//             {/* Title */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Task Title <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={formData.title}
//                 onChange={(e) => handleChange('title', e.target.value)}
//                 className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                   errors.title ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder="Enter task title"
//               />
//               {errors.title && (
//                 <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
//                   <AlertCircle size={14} />
//                   {errors.title}
//                 </p>
//               )}
//             </div>
            
//             {/* Description */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Description
//               </label>
//               <textarea
//                 value={formData.description}
//                 onChange={(e) => handleChange('description', e.target.value)}
//                 rows={4}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter task description"
//               />
//             </div>
            
//             {/* Category and User Selection */}
//             <div className="grid grid-cols-2 gap-4">
//               {/* Category */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Category <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   value={formData.categoryId}
//                   onChange={(e) => handleChange('categoryId', e.target.value)}
//                   className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                     errors.categoryId ? 'border-red-500' : 'border-gray-300'
//                   }`}
//                 >
//                   <option value="">Select Category</option>
//                   {categories.map(cat => (
//                     <option key={cat.id} value={cat.id}>
//                       {getCategoryPath(cat.id)}
//                     </option>
//                   ))}
//                 </select>
//                 {errors.categoryId && (
//                   <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
//                     <AlertCircle size={14} />
//                     {errors.categoryId}
//                   </p>
//                 )}
//               </div>
              
//               {/* ✅ Assigned User - WITH ID RESOLVER */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Assign To <span className="text-red-500">*</span>
//                   {formData.categoryId && (
//                     <span className="text-xs text-gray-500 ml-1">
//                       ({eligibleUsers.length} users available)
//                     </span>
//                   )}
//                 </label>
//                 <select
//                   value={formData.assignedTo}
//                   onChange={(e) => {
//                     const selectedId = e.target.value;
//                     console.log('👤 User selected from dropdown:', selectedId);
//                     handleChange('assignedTo', selectedId);
//                   }}
//                   disabled={!formData.categoryId}
//                   className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
//                     errors.assignedTo ? 'border-red-500' : 'border-gray-300'
//                   }`}
//                 >
//                   <option value="">
//                     {formData.categoryId ? 'Select User' : 'Select category first'}
//                   </option>
//                   {eligibleUsers.map(user => {
//                     // ✅ Use ID resolver to get canonical ID
//                     const userId = UserIdResolver.getUserId(user);
//                     const displayName = user.name || user.username;
//                     const displayEmail = user.email;
                    
//                     return (
//                       <option key={userId} value={userId}>
//                         {displayName} - {displayEmail}
//                       </option>
//                     );
//                   })}
//                 </select>
//                 {formData.categoryId && eligibleUsers.length === 0 && (
//                   <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
//                     <AlertCircle size={14} />
//                     No users assigned to this category
//                   </p>
//                 )}
//                 {errors.assignedTo && (
//                   <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
//                     <AlertCircle size={14} />
//                     {errors.assignedTo}
//                   </p>
//                 )}
//                 {/* Debug info - remove in production */}
//                 {formData.assignedTo && process.env.NODE_ENV === 'development' && (
//                   <p className="text-xs text-gray-400 mt-1">
//                     Debug: Selected ID = {formData.assignedTo}
//                   </p>
//                 )}
//               </div>
//             </div>
            
//             {/* Priority, Status, Due Date */}
//             <div className="grid grid-cols-3 gap-4">
//               {/* Priority */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Priority
//                 </label>
//                 <select
//                   value={formData.priority}
//                   onChange={(e) => handleChange('priority', e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   <option value="low">Low</option>
//                   <option value="medium">Medium</option>
//                   <option value="high">High</option>
//                   <option value="urgent">Urgent</option>
//                 </select>
//               </div>
              
//               {/* Status (only show when editing) */}
//               {isEdit && (
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Status
//                   </label>
//                   <select
//                     value={formData.status}
//                     onChange={(e) => handleChange('status', e.target.value)}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="in-progress">In Progress</option>
//                     <option value="completed">Completed</option>
//                     <option value="cancelled">Cancelled</option>
//                   </select>
//                 </div>
//               )}
              
//               {/* Due Date */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Due Date
//                 </label>
//                 <input
//                   type="date"
//                   value={formData.dueDate}
//                   onChange={(e) => handleChange('dueDate', e.target.value)}
//                   min={new Date().toISOString().split('T')[0]}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             </div>
            
//             {/* Estimated Hours and Tags */}
//             <div className="grid grid-cols-2 gap-4">
//               {/* Estimated Hours */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Estimated Hours
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   step="0.5"
//                   value={formData.estimatedHours}
//                   onChange={(e) => handleChange('estimatedHours', e.target.value)}
//                   className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                     errors.estimatedHours ? 'border-red-500' : 'border-gray-300'
//                   }`}
//                   placeholder="e.g., 8"
//                 />
//                 {errors.estimatedHours && (
//                   <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
//                     <AlertCircle size={14} />
//                     {errors.estimatedHours}
//                   </p>
//                 )}
//               </div>
              
//               {/* Tags */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Tags
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.tags}
//                   onChange={(e) => handleChange('tags', e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="e.g., urgent, frontend, bug-fix"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
//               </div>
//             </div>
//           </div>
          
//           {/* Form Actions */}
//           <div className="flex gap-3 mt-6 pt-6 border-t">
//             <button
//               onClick={handleSubmit}
//               className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
//             >
//               <Save size={20} />
//               {isEdit ? 'Update Task' : 'Create Task'}
//             </button>
//             <button
//               onClick={onCancel}
//               className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TaskForm;

// components/TaskForm.jsx - Task Form with Worksheet Template Selection

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Save, AlertCircle, FileText, CheckCircle, Folder, Search, ArrowRight, ChevronDown, BookOpen, ListTodo, Workflow as WorkflowIcon } from 'lucide-react';
import UserIdResolver from '../user/UserIdResolver';
import WorksheetService from '../../services/WorksheetService';
import GuidelineService from '../../services/GuidelineService';
import ChecklistService from '../../services/ChecklistService';
import WorkflowService from '../../services/workflowService';
import UserDependencyService from '../../services/userDependencyService';
const TaskForm = ({ 
  task = null, 
  categories = [], 
  users = [],
  onSubmit, 
  onCancel,
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    assignedTo: '',
    checkerId: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    estimatedHours: '',
    tags: '',
    workflowId: '',
    userDependencyId: ''
  });

  const [errors, setErrors] = useState({});
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [eligibleCheckers, setEligibleCheckers] = useState([]);
  
  // Worksheet template states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [hasWorksheet, setHasWorksheet] = useState(false);

  // Guidelines and checklist states
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [hasGuideline, setHasGuideline] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [hasChecklist, setHasChecklist] = useState(false);

  // Workflow states
  const [workflows, setWorkflows] = useState([]);
  const [userDependencies, setUserDependencies] = useState([]);
  const [filteredDependencies, setFilteredDependencies] = useState([]);

  // Category dropdown states
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const categoryDropdownRef = useRef(null);

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        categoryId: task.categoryId || '',
        assignedTo: task.assignedTo || '',
        checkerId: task.checkerId || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours || '',
        tags: task.tags?.join(', ') || ''
      });
    }
  }, [task]);

  // ==========================================
  // WORKSHEET TEMPLATE LOADING
  // ==========================================
  
  // Load worksheet template, guideline, and checklist when category changes
  useEffect(() => {
    if (formData.categoryId) {
      loadWorksheetTemplate(formData.categoryId);
      loadGuidelineAndChecklist(formData.categoryId);
    } else {
      setSelectedTemplate(null);
      setHasWorksheet(false);
      setSelectedGuideline(null);
      setHasGuideline(false);
      setSelectedChecklist(null);
      setHasChecklist(false);
    }
  }, [formData.categoryId]);

  const loadWorksheetTemplate = (categoryId) => {
    setTemplateLoading(true);
    try {
      const template = WorksheetService.getTemplateByCategory(categoryId);
      
      if (template) {
        setSelectedTemplate(template);
        setHasWorksheet(true);
        console.log('✅ Worksheet template found:', {
          name: template.name,
          fields: template.fields.length
        });
      } else {
        setSelectedTemplate(null);
        setHasWorksheet(false);
        console.log('⚠️ No worksheet template for category:', categoryId);
      }
    } catch (error) {
      console.error('Error loading worksheet template:', error);
      setSelectedTemplate(null);
      setHasWorksheet(false);
    }
    setTemplateLoading(false);
  };

  // ==========================================
  // GUIDELINE & CHECKLIST LOADING
  // ==========================================

  const loadGuidelineAndChecklist = (categoryId) => {
    try {
      // Load guideline
      const guideline = GuidelineService.getGuidelineByCategory(categoryId);
      if (guideline) {
        setSelectedGuideline(guideline);
        setHasGuideline(true);
        console.log('✅ Guideline found for category:', categoryId);
      } else {
        setSelectedGuideline(null);
        setHasGuideline(false);
      }

      // Load checklist
      const checklist = ChecklistService.getChecklistByCategory(categoryId);
      if (checklist) {
        setSelectedChecklist(checklist);
        setHasChecklist(true);
        console.log('✅ Checklist found for category:', categoryId);
      } else {
        setSelectedChecklist(null);
        setHasChecklist(false);
      }
    } catch (error) {
      console.error('Error loading guideline/checklist:', error);
      setSelectedGuideline(null);
      setHasGuideline(false);
      setSelectedChecklist(null);
      setHasChecklist(false);
    }
  };

  // Load workflows and dependencies
  useEffect(() => {
    const allWorkflows = WorkflowService.getAllWorkflows();
    setWorkflows(allWorkflows);
    
    const allDependencies = UserDependencyService.getAllUserDependencies();
    setUserDependencies(allDependencies);
  }, []);

  // Filter dependencies when workflow is selected
  useEffect(() => {
    if (formData.workflowId) {
      const filtered = userDependencies.filter(dep => dep.workflowId === formData.workflowId);
      setFilteredDependencies(filtered);
      
      // Clear dependency if it doesn't belong to selected workflow
      if (formData.userDependencyId && !filtered.some(dep => dep.id === formData.userDependencyId)) {
        setFormData(prev => ({ ...prev, userDependencyId: '' }));
      }
    } else {
      setFilteredDependencies([]);
      setFormData(prev => ({ ...prev, userDependencyId: '' }));
    }
  }, [formData.workflowId, userDependencies]);

  // Auto-fill first stage when dependency is selected
  useEffect(() => {
    if (formData.userDependencyId && !task) { // Only auto-fill when creating (not editing)
      const dependency = userDependencies.find(dep => dep.id === formData.userDependencyId);
      if (dependency && dependency.stageAssignments.length > 0) {
        const firstStage = dependency.stageAssignments[0];
        setFormData(prev => ({
          ...prev,
          categoryId: firstStage.categoryId,
          assignedTo: firstStage.userId,
          checkerId: firstStage.checkerId
        }));
      }
    }
  }, [formData.userDependencyId, userDependencies]);

  // ==========================================
  // USER FILTERING BY CATEGORY
  // ==========================================

  // Update eligible users when category changes
  useEffect(() => {

    console.log('🔍 Filtering users. Total users:', users.length, 'Category:', formData.categoryId);
    
    if (formData.categoryId) {
      // Filter users with role_id 2 (Doer)
      const eligible = users.filter(user => {
        const isActive = user.status === 'active';
        const isDoer = Number(user.role_id) === 2; // Convert to number for comparison
        const hasCategories = user.assigned_category_ids && user.assigned_category_ids.length > 0;
        
        if (!isActive || !isDoer || !hasCategories) return false;
        
        // Check if user has 'all' categories access
        if (user.assigned_category_ids.includes('all')) return true;
        
        // Check if user is assigned to this category
        return user.assigned_category_ids.includes(formData.categoryId);
      });
      
      console.log('📋 Eligible users (Doers) for category:', formData.categoryId);
      console.log('   Found:', eligible.length, 'doers');
      console.log('   Sample users:', eligible.slice(0, 2).map(u => ({ name: u.name || u.username, role_id: u.role_id, categories: u.assigned_category_ids })));
      setEligibleUsers(eligible);
      
      // Clear assigned user if not eligible (using ID resolver)
      if (formData.assignedTo) {
        const isStillEligible = eligible.some(u => {
          const userId = UserIdResolver.getUserId(u);
          return String(userId) === String(formData.assignedTo);
        });
        
        if (!isStillEligible) {
          console.log('⚠️ Previously selected user not eligible, clearing selection');
          setFormData(prev => ({ ...prev, assignedTo: '' }));
        }
      }

      // Filter checkers with role_id 3 (Checker)
      const eligibleChkrs = users.filter(user => {
        const isActive = user.status === 'active';
        const isChecker = Number(user.role_id) === 3; // Convert to number for comparison
        const hasCategories = user.assigned_category_ids && user.assigned_category_ids.length > 0;
        
        if (!isActive || !isChecker || !hasCategories) return false;
        
        // Check if checker has 'all' categories access
        if (user.assigned_category_ids.includes('all')) return true;
        
        // Check if checker is assigned to this category
        return user.assigned_category_ids.includes(formData.categoryId);
      });
      
      console.log('✓ Eligible checkers for category:', formData.categoryId);
      console.log('   Found:', eligibleChkrs.length, 'checkers');
      console.log('   Sample checkers:', eligibleChkrs.slice(0, 2).map(u => ({ name: u.name || u.username, role_id: u.role_id, categories: u.assigned_category_ids })));
      setEligibleCheckers(eligibleChkrs);
      
      // Clear assigned checker if not eligible
      if (formData.checkerId) {
        const isStillEligible = eligibleChkrs.some(u => {
          const userId = UserIdResolver.getUserId(u);
          return String(userId) === String(formData.checkerId);
        });
        
        if (!isStillEligible) {
          console.log('⚠️ Previously selected checker not eligible, clearing selection');
          setFormData(prev => ({ ...prev, checkerId: '' }));
        }
      }
    } else {
      setEligibleUsers([]);
      setEligibleCheckers([]);
      setFormData(prev => ({ ...prev, assignedTo: '', checkerId: '' }));
    }
  }, [formData.categoryId, users]);

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

  // Render category tree node
  const renderTreeNode = (cat, depth = 0) => {
    const isSelected = formData.categoryId === cat.id;
    const isExpanded = expandedNodes.has(cat.id);
    const hasChildren = cat.children && cat.children.length > 0;

    return (
      <div key={cat.id} className="select-none">
        <label
          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
            isSelected
              ? 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-300'
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
                <ChevronDown size={20} className="text-gray-600" />
              ) : (
                <ArrowRight size={20} className="text-gray-600" />
              )}
            </button>
          )}
          
          {/* Spacing for leaf nodes */}
          {!hasChildren && <div className="w-5" />}

          {/* Radio button */}
          <input
            type="radio"
            name="category"
            checked={isSelected}
            onChange={(e) => {
              handleChange('categoryId', cat.id);
              setShowCategoryDropdown(false);
            }}
            className="mt-0.5"
          />

          {/* Category info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800">
              {cat.name}
            </div>
            <div className="text-xs mt-1 flex items-center gap-2 text-gray-500">
              {cat.categoryId && (
                <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-gray-100 text-gray-600">
                  {cat.categoryId}
                </span>
              )}
              {hasChildren && (
                <span className="text-xs">
                  ({cat.children.length} subcategories)
                </span>
              )}
            </div>
            {cat.description && (
              <div className="text-xs mt-1.5 line-clamp-2 text-gray-600">
                {cat.description}
              </div>
            )}
          </div>
        </label>

        {/* Child categories */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l-2 border-gray-300">
            {cat.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get category full path
  const getCategoryPath = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    const getParentChain = (cat) => {
      const chain = [cat.name];
      let currentId = cat.parentId;
      while (currentId) {
        const parent = categories.find(c => c.id === currentId);
        if (!parent) break;
        chain.unshift(parent.name);
        currentId = parent.parentId;
      }
      return chain.join(' > ');
    };
    
    return getParentChain(category);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Assigned user is required';
    }
    
    if (formData.estimatedHours && (isNaN(formData.estimatedHours) || formData.estimatedHours < 0)) {
      newErrors.estimatedHours = 'Please enter a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('=== TASK FORM SUBMISSION ===');
    console.log('Form assignedTo value:', formData.assignedTo);
    
    // Find selected user using ID resolver
    const selectedUser = UserIdResolver.findUserById(users, formData.assignedTo);
    
    if (!selectedUser) {
      console.error('❌ ERROR: No user found with ID:', formData.assignedTo);
      alert('Error: Selected user not found. Please try again.');
      return;
    }
    
    // Get canonical user ID using resolver
    const assignedToId = UserIdResolver.getUserId(selectedUser);
    const assignedToName = selectedUser.name || selectedUser.username;
    
    console.log('✅ Selected user:', {
      username: selectedUser.username,
      canonicalId: assignedToId
    });

    // Find selected checker if provided
    let checkerId = null;
    let checkerName = null;
    if (formData.checkerId) {
      const selectedChecker = UserIdResolver.findUserById(users, formData.checkerId);
      if (selectedChecker) {
        checkerId = UserIdResolver.getUserId(selectedChecker);
        checkerName = selectedChecker.name || selectedChecker.username;
        console.log('✅ Selected checker:', {
          username: selectedChecker.username,
          canonicalId: checkerId
        });
      }
    }
    
    // Get workflow and dependency info if selected
    let workflowName = null;
    let dependencyName = null;
    if (formData.workflowId) {
      const workflow = workflows.find(w => w.id === formData.workflowId);
      workflowName = workflow?.name || null;
    }
    if (formData.userDependencyId) {
      const dependency = userDependencies.find(d => d.id === formData.userDependencyId);
      dependencyName = dependency?.name || null;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      categoryPath: getCategoryPath(formData.categoryId),
      assignedTo: assignedToId,
      assignedToName: assignedToName,
      checkerId: checkerId,
      checkerName: checkerName,
      priority: formData.priority,
      status: formData.status,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      hasWorksheet: hasWorksheet,
      worksheetTemplateId: selectedTemplate?.id || null,
      // Workflow fields
      workflowId: formData.workflowId || null,
      workflowName: workflowName,
      userDependencyId: formData.userDependencyId || null,
      userDependencyName: dependencyName,
      currentStage: 0 // Will be set to 1 in TaskService if workflow is selected
    };
    
    console.log('✅ Final task data:', {
      title: taskData.title,
      assignedTo: taskData.assignedTo,
      assignedToName: taskData.assignedToName,
      checkerId: taskData.checkerId,
      checkerName: taskData.checkerName,
      hasWorksheet: taskData.hasWorksheet,
      worksheetTemplate: selectedTemplate?.name || 'None'
    });
    console.log('==============================');

    onSubmit(taskData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ==========================================
  // RENDER WORKSHEET TEMPLATE SECTION
  // ==========================================

  const renderWorksheetSection = () => {
    if (!formData.categoryId) {
      return null;
    }

    if (templateLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Loading worksheet template...</span>
          </div>
        </div>
      );
    }

    if (hasWorksheet && selectedTemplate) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                <FileText size={16} />
                Worksheet Template Available
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-green-800">
                  <strong>Template:</strong> {selectedTemplate.name}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Fields:</strong> {selectedTemplate.fields.length} field{selectedTemplate.fields.length !== 1 ? 's' : ''}
                </p>
                {selectedTemplate.description && (
                  <p className="text-sm text-green-700 italic mt-2">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>
              <div className="mt-3 p-2 bg-white rounded text-xs text-green-700">
                <strong>ℹ️ Note:</strong> When you assign this task to a user, they will be prompted to fill out this worksheet.
              </div>
            </div>
          </div>
        </div>
      );
    }

    // No worksheet template found
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">
              No Worksheet Template
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              This category doesn't have a worksheet template. Users can still work on this task, but won't be asked to fill out a worksheet.
            </p>
            <p className="text-xs text-amber-700 mt-2">
              💡 Admin can add a template in the Worksheet Builder.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-6">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.title}
                </p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task description"
              />
            </div>
            
            {/* Task Dependency Selection (Optional) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <WorkflowIcon size={18} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">
                  Task Dependency (Optional)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Task Dependency Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select Task Dependency
                  </label>
                  <select
                    value={formData.workflowId}
                    onChange={(e) => handleChange('workflowId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No Task Dependency (Direct Assignment)</option>
                    {workflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name} ({workflow.categoryFlow.length} stages)
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Dependency Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select User Dependency
                  </label>
                  <select
                    value={formData.userDependencyId}
                    onChange={(e) => handleChange('userDependencyId', e.target.value)}
                    disabled={!formData.workflowId}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {formData.workflowId ? 'Select Dependency...' : 'Select task dependency first'}
                    </option>
                    {filteredDependencies.map(dep => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                  {formData.workflowId && filteredDependencies.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No dependencies available for this task dependency
                    </p>
                  )}
                  {formData.userDependencyId && (
                    <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Will auto-assign users from first stage
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Category Selection - Hierarchical Dropdown */}
            <div className="relative" ref={categoryDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              {/* Category Selector Button */}
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`w-full px-4 py-2 border-2 rounded-lg flex items-center justify-between transition-all text-left ${
                  showCategoryDropdown 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-30' 
                    : errors.categoryId 
                      ? 'border-red-500 bg-white hover:border-red-600'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Folder size={18} className={showCategoryDropdown ? 'text-blue-500' : 'text-gray-500'} />
                  <div className="flex-1 min-w-0">
                    {formData.categoryId ? (
                      <div className="text-sm font-medium text-gray-900">
                        {getCategoryPath(formData.categoryId)}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Select Category
                      </span>
                    )}
                  </div>
                </div>
                {showCategoryDropdown ? <ChevronDown size={20} /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>

              {/* Category Tree Dropdown */}
              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-2 rounded-lg shadow-2xl border-2 bg-white border-gray-200">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Tree */}
                  <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                    {visibleTree.length === 0 ? (
                      <div className="p-8 text-center">
                        <Folder size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500">
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
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(false)}
                      className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.categoryId}
                </p>
              )}
            </div>

            {/* ==========================================
                WORKSHEET TEMPLATE SECTION
                ========================================== */}
            {renderWorksheetSection()}

            {/* ==========================================
                GUIDELINE SECTION
                ========================================== */}
            {formData.categoryId && hasGuideline && selectedGuideline && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900">
                      Guideline Found for This Category
                    </h3>
                    <p className="text-sm text-green-800 mt-1">
                      <strong>Title:</strong> {selectedGuideline.title}
                    </p>
                    <div className="mt-2 p-2 bg-white rounded text-xs text-green-700 max-h-32 overflow-y-auto">
                      <strong>Content:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{selectedGuideline.content}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                CHECKLIST SECTION
                ========================================== */}
            {formData.categoryId && hasChecklist && selectedChecklist && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ListTodo className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900">
                      Checklist Found for This Category
                    </h3>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Title:</strong> {selectedChecklist.title}
                    </p>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {(selectedChecklist.items || []).slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-blue-800">
                          <div className="w-4 h-4 border-2 border-blue-600 rounded flex-shrink-0" />
                          {item.text}
                        </div>
                      ))}
                      {(selectedChecklist.items || []).length > 5 && (
                        <p className="text-xs text-blue-700 italic">
                          +{(selectedChecklist.items || []).length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category, User, and Checker Selection */}
            <div className="grid grid-cols-3 gap-4">
              {/* Assigned User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To (Doer) <span className="text-red-500">*</span>
                  {formData.categoryId && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({eligibleUsers.length} available)
                    </span>
                  )}
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    console.log('👤 User selected from dropdown:', selectedId);
                    handleChange('assignedTo', selectedId);
                  }}
                  disabled={!formData.categoryId}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                    errors.assignedTo ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">
                    {formData.categoryId ? 'Select Doer' : 'Select category first'}
                  </option>
                  {eligibleUsers.map(user => {
                    const userId = UserIdResolver.getUserId(user);
                    const displayName = user.name || user.username;
                    const displayEmail = user.email;
                    
                    return (
                      <option key={userId} value={userId}>
                        {displayName} - {displayEmail}
                      </option>
                    );
                  })}
                </select>
                {formData.categoryId && eligibleUsers.length === 0 && (
                  <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    No users assigned to this category
                  </p>
                )}
                {errors.assignedTo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.assignedTo}
                  </p>
                )}
              </div>

              {/* Checker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Checker
                  {formData.categoryId && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({eligibleCheckers.length} available)
                    </span>
                  )}
                </label>
                <select
                  value={formData.checkerId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    console.log('✓ Checker selected from dropdown:', selectedId);
                    handleChange('checkerId', selectedId);
                  }}
                  disabled={!formData.categoryId}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 ${
                    errors.checkerId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">
                    {formData.categoryId ? 'Select Checker (Optional)' : 'Select category first'}
                  </option>
                  {eligibleCheckers.map(user => {
                    const userId = UserIdResolver.getUserId(user);
                    const displayName = user.name || user.username;
                    const displayEmail = user.email;
                    
                    return (
                      <option key={userId} value={userId}>
                        {displayName} - {displayEmail}
                      </option>
                    );
                  })}
                </select>
                {formData.categoryId && eligibleCheckers.length === 0 && (
                  <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    No checkers assigned to this category
                  </p>
                )}
                {errors.checkerId && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.checkerId}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            {/* Priority, Status, Due Date */}
            <div className={`grid ${isEdit ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              {/* Status (only show when editing) */}
              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              
              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Estimated Hours and Tags */}
            <div className="grid grid-cols-2 gap-4">
              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => handleChange('estimatedHours', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.estimatedHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 8"
                />
                {errors.estimatedHours && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.estimatedHours}
                  </p>
                )}
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., urgent, frontend, bug-fix"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={20} />
              {isEdit ? 'Update Task' : 'Create Task'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default TaskForm;