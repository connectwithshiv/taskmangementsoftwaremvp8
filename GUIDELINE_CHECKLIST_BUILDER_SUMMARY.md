# Guideline & Checklist Builder Summary

## Overview

This document summarizes the implementation of the Guidelines Builder and Checklist Builder features, similar to the Worksheet Builder, that allow admins to create content for task categories.

## Features Implemented

### 1. Guidelines Builder (`GuidelinePage.jsx`)

**Purpose:** Create and manage guidelines for task categories with rich text support.

**Key Features:**
- Multi-category selection using hierarchical dropdown (similar to UserForm and WorksheetPage)
- Rich text editor (textarea) for guideline content
- Support for large amounts of text
- Preview mode to view guidelines before publishing
- Edit and delete functionality
- Dark mode support

**Data Model:**
```javascript
{
  id: string,
  title: string,
  categoryIds: array, // Multiple category IDs
  content: string, // Large text content
  createdAt: ISO string,
  updatedAt: ISO string
}
```

**Storage:**
- Uses `GuidelineService` to store data in localStorage
- Supports chunking for large data sets

### 2. Checklist Builder (`ChecklistPage.jsx`)

**Purpose:** Create and manage checklists for task categories.

**Key Features:**
- Multi-category selection using hierarchical dropdown
- Dynamic checklist item builder
- Add, edit, delete, and reorder checklist items
- Preview mode
- Expandable item editor with move controls
- Dark mode support

**Data Model:**
```javascript
{
  id: string,
  title: string,
  categoryIds: array, // Multiple category IDs
  items: [
    {
      id: string,
      text: string
    }
  ],
  createdAt: ISO string,
  updatedAt: ISO string
}
```

**Storage:**
- Uses `ChecklistService` to store data in localStorage
- Supports chunking for large data sets

### 3. Services

#### GuidelineService (`src/services/GuidelineService.js`)
- `getAllGuidelines()` - Get all guidelines
- `getGuidelineById(guidelineId)` - Get guideline by ID
- `getGuidelineByCategory(categoryId)` - Get guideline for a category
- `getGuidelinesByCategory(categoryId)` - Get all guidelines for a category
- `createGuideline(guidelineData)` - Create new guideline
- `updateGuideline(guidelineId, updateData)` - Update guideline
- `deleteGuideline(guidelineId)` - Delete guideline
- `hasGuideline(categoryId)` - Check if category has guideline
- `exportGuidelines()` - Export all guidelines
- `clearAll()` - Clear all guidelines

#### ChecklistService (`src/services/ChecklistService.js`)
- `getAllChecklists()` - Get all checklists
- `getChecklistById(checklistId)` - Get checklist by ID
- `getChecklistByCategory(categoryId)` - Get checklist for a category
- `getChecklistsByCategory(categoryId)` - Get all checklists for a category
- `createChecklist(checklistData)` - Create new checklist
- `updateChecklist(checklistId, updateData)` - Update checklist
- `deleteChecklist(checklistId)` - Delete checklist
- `hasChecklist(categoryId)` - Check if category has checklist
- `exportChecklists()` - Export all checklists
- `clearAll()` - Clear all checklists

### 4. Task Form Integration (`TaskForm.jsx`)

**Purpose:** Display guidelines and checklists when creating/editing tasks.

**Key Features:**
- Automatically loads guideline and checklist for selected category
- Displays "Guideline Found for This Category" message with content preview
- Displays "Checklist Found for This Category" message with items preview
- Shows first 5 checklist items with "+X more" indicator
- Green background for guideline section
- Blue background for checklist section
- Scrollable content areas for long guidelines/checklists

**Integration Flow:**
1. User selects a category in Task Form
2. System loads worksheet template, guideline, and checklist for that category
3. If guideline exists, shows green info box with title and content preview
4. If checklist exists, shows blue info box with title and first 5 items
5. Messages update when category changes

### 5. Navigation

**Sidebar Updates (`Sidebar.jsx`):**
- Added "Guidelines Builder" menu item with `MdBook` icon
- Added "Checklist Builder" menu item with `MdCheckBox` icon
- Both marked with "NEW" badge
- Positioned after Worksheet Builder

**App.jsx Updates:**
- Imported `GuidelinePage` and `ChecklistPage`
- Added navigation handlers for `guidelines` and `checklists` pages
- Both pages receive `isDarkMode` prop

## Key Differences from Worksheet Builder

### Guidelines vs Worksheets

| Feature | Guidelines | Worksheets |
|---------|-----------|-----------|
| Content Type | Plain text (rich textarea) | Structured fields with types |
| Purpose | Provide instructions/rules | Collect structured data |
| Submission | No submission form | Has submission form for users |
| Display | Read-only in Task Form | Fillable form for users |
| Storage | Simple text field | Array of field objects |

### Checklists vs Worksheets

| Feature | Checklists | Worksheets |
|---------|-----------|-----------|
| Content Type | List of checkbox items | Structured fields with types |
| Purpose | Track completion | Collect structured data |
| Submission | No submission form | Has submission form for users |
| Display | Read-only in Task Form | Fillable form for users |
| Storage | Array of items | Array of field objects |

### Common Features

All three builders share:
- Multi-category hierarchical selection
- Tab-based UI (List/Edit tabs)
- Preview mode
- Edit/Delete functionality
- Dark mode support
- localStorage storage with chunking support

## Technical Implementation

### Hierarchical Category Selection

All three builders use the same hierarchical category dropdown pattern:
- Tree structure built from categories
- Checkboxes for multi-select
- Expandable nodes with depth indentation
- Search functionality with auto-expand
- Indeterminate state for partial selections
- Custom scrollbar styling

### Data Normalization

Services handle both old single `categoryId` and new `categoryIds` array formats:
```javascript
// Old format support
const categoryIds = guideline.categoryIds || (guideline.categoryId ? [guideline.categoryId] : []);

// Normalize to array
categoryIds: Array.isArray(data.categoryIds) 
  ? data.categoryIds 
  : (data.categoryId ? [data.categoryId] : [])
```

### Storage Chunking

For large data sets, localStorage data is split into chunks:
- Automatically when data exceeds 1MB
- Chunks stored as `key_chunk_0`, `key_chunk_1`, etc.
- Chunk count stored in `key_chunks`
- Transparent to consumers of the service

## Usage Workflow

### Creating Guidelines

1. Navigate to Guidelines Builder from sidebar
2. Click "New Guideline"
3. Enter title
4. Select one or more categories from hierarchical dropdown
5. Enter guideline content in textarea
6. Click "Save Guideline"
7. Guideline appears in list view

### Creating Checklists

1. Navigate to Checklist Builder from sidebar
2. Click "New Checklist"
3. Enter title
4. Select one or more categories from hierarchical dropdown
5. Click "Add Item" for each checklist item
6. Enter item text in expanded editor
7. Reorder items with up/down arrows if needed
8. Click "Save Checklist"
9. Checklist appears in list view

### Using in Task Form

1. Open Task Form (Create or Edit)
2. Select a category
3. If guideline exists for category, see green info box with guideline preview
4. If checklist exists for category, see blue info box with checklist preview
5. Worksheet template (if exists) shown in separate section
6. All three pieces of information help inform task creation

## Files Created/Modified

### New Files
- `src/services/GuidelineService.js` (249 lines)
- `src/services/ChecklistService.js` (249 lines)
- `src/pages/GuidelinePage.jsx` (759 lines)
- `src/pages/ChecklistPage.jsx` (929 lines)
- `GUIDELINE_CHECKLIST_BUILDER_SUMMARY.md` (this file)

### Modified Files
- `src/components/task/TaskForm.jsx`
  - Added imports for GuidelineService and ChecklistService
  - Added state for guidelines and checklists
  - Added loading logic in useEffect
  - Added info box sections for displaying guidelines and checklists
- `src/App.jsx`
  - Added imports for GuidelinePage and ChecklistPage
  - Added navigation handlers for guidelines and checklists pages
- `src/components/common/Sidebar.jsx`
  - Added imports for MdBook and MdCheckBox icons
  - Added menu items for Guidelines Builder and Checklist Builder

## Testing Recommendations

### Functional Testing
1. Create guidelines for different categories
2. Test multi-category assignment
3. Create checklists with multiple items
4. Test item reordering
5. Test search in category dropdown
6. Test preview mode
7. Test edit and delete operations
8. Verify data persistence across page reloads

### Integration Testing
1. Create task and verify guideline/checklist display
2. Change category in Task Form and verify updates
3. Test with categories that have no guidelines/checklists
4. Test with categories that have guidelines but not checklists (and vice versa)
5. Verify all three info boxes (worksheet/guideline/checklist) display correctly together

### Edge Cases
1. Categories with long guideline text (scrollbar)
2. Checklists with many items (scrollbar in Task Form preview)
3. Special characters in guideline content
4. Empty checklists (should show validation error)
5. Deleting a guideline/checklist and creating task immediately after

## Future Enhancements

1. **Rich Text Editor:** Replace textarea with WYSIWYG editor (TinyMCE, Quill, etc.)
2. **Formatting Options:** Support bold, italic, lists, links in guidelines
3. **Checklist Templates:** Pre-built checklist templates for common use cases
4. **Version History:** Track changes to guidelines and checklists
5. **Bulk Operations:** Import/export guidelines and checklists
6. **Search:** Full-text search across guideline and checklist content
7. **Attachments:** Attach files to guidelines
8. **Comments:** Add notes to checklist items
9. **Conditional Logic:** Show/hide checklist items based on conditions
10. **Analytics:** Track which guidelines/checklists are most viewed

## Support

For questions or issues:
1. Check browser console for errors
2. Verify localStorage has sufficient space
3. Test with different categories
4. Clear localStorage and retry if data corruption suspected


