# Worksheet System - Testing Guide

## 🧪 Quick Testing Steps

### Prerequisites
- Clear localStorage or use incognito mode for fresh start
- Have admin and user accounts ready

---

## Test 1: Create Worksheet Template (Admin)

### Steps:
1. Login as **Admin** (role_id = 1)
2. Look for "Worksheet Builder" option in the admin sidebar
3. Click "New Template"
4. Fill in:
   ```
   Template Name: Code Review Checklist
   Category: Select any existing category
   Description: Checklist for code review tasks
   ```
5. Click "Add Field" and create:
   ```
   Field 1:
   - Label: "Code Repository URL"
   - Type: Text
   - Required: Yes
   - Placeholder: "https://github.com/..."
   
   Field 2:
   - Label: "Number of Files Changed"
   - Type: Number
   - Required: Yes
   
   Field 3:
   - Label: "Review Status"
   - Type: Dropdown
   - Options: (one per line)
     Approved
     Needs Changes
     Rejected
   - Required: Yes
   
   Field 4:
   - Label: "Comments"
   - Type: Textarea
   - Required: No
   ```
6. Click "Save"

### Expected Result:
✅ "Template created successfully" alert
✅ Template appears in the list
✅ Template shows category name and field count

---

## Test 2: Create Task with Worksheet (Admin)

### Steps:
1. Navigate to "Tasks" page
2. Click "Create Task"
3. Fill in:
   ```
   Title: Review Authentication Module
   Description: Review the new auth implementation
   Category: [Select the same category from Test 1]
   Priority: High
   Due Date: [Any future date]
   ```
4. **Watch for green indicator:** "✓ Worksheet Template Available"
5. Assign to a user
6. Click "Create Task"

### Expected Result:
✅ Green worksheet indicator appears when category is selected
✅ Shows template name and field count
✅ Task created successfully
✅ Task appears in task list

---

## Test 3: View Worksheet as User

### Steps:
1. Logout from admin
2. Login as the **user** assigned to the task
3. Navigate to "My Tasks"
4. Find the task you created

### Expected Result:
✅ Task shows green box: "✓ Worksheet Required"
✅ "Fill Worksheet" button is visible
✅ Task details are displayed correctly

---

## Test 4: Fill and Submit Worksheet (User)

### Steps:
1. Click "Fill Worksheet" button
2. Modal opens with the worksheet form
3. Fill in all fields:
   ```
   Code Repository URL: https://github.com/example/auth
   Number of Files Changed: 15
   Review Status: Approved
   Comments: Great implementation, well tested
   ```
4. Click "Submit Worksheet"

### Expected Result:
✅ Form validates required fields
✅ Success message: "✅ Worksheet submitted successfully!"
✅ Modal closes automatically
✅ Task list refreshes

---

## Test 5: View Submission (Admin)

### Steps:
1. Logout and login as **Admin**
2. Navigate to "Tasks" page
3. Find the task
4. Look for "View Submissions" option
5. Click to view submissions

### Expected Result:
✅ Shows list of submissions
✅ Displays submission count
✅ Can click to view full details
✅ Shows all field data submitted by user
✅ Can add review notes
✅ Can change submission status

---

## 🔍 Verification Checklist

### localStorage Verification:
Open browser DevTools → Application → Local Storage → Check:

1. **worksheetTemplates** key exists
   - Should contain array of templates
   - Each template has: id, name, categoryId, fields[]

2. **worksheetSubmissions** key exists
   - Should contain array of submissions
   - Each submission has: id, taskId, userId, data{}

3. **taskManagement_tasks** key updated
   - Tasks should have: hasWorksheet, worksheetTemplateId, worksheetSubmissions[]

### Console Verification:
Open browser DevTools → Console → Check for:

```
✅ Worksheet template found: { name: "...", fields: N }
✅ Task created: { hasWorksheet: true, worksheetTemplateId: "..." }
✅ Worksheet submitted successfully
```

---

## 🐛 Common Issues & Solutions

### Issue: "Worksheet Builder" not showing in sidebar
**Solution:** 
- Ensure you're logged in as admin (role_id = 1)
- Check if WorksheetBuilder is added to admin sidebar menu
- Refresh the page

### Issue: No worksheet indicator in task creation
**Solution:**
- Verify template exists for selected category
- Check console for errors
- Ensure WorksheetService is imported and working

### Issue: "Fill Worksheet" button not showing
**Solution:**
- Check if task has `hasWorksheet: true` in localStorage
- Verify UserTaskListWithWorksheet is being used (not old UserTaskList)
- Check console for errors

### Issue: Worksheet not submitting
**Solution:**
- Check all required fields are filled
- Verify WorksheetService is available globally: `window.WorksheetService`
- Check console for errors
- Ensure user is authenticated

---

## 🧹 Clean Testing Environment

To start fresh testing:

```javascript
// Open browser console and run:
localStorage.removeItem('worksheetTemplates');
localStorage.removeItem('worksheetSubmissions');
localStorage.removeItem('worksheetDrafts');

// Or clear everything:
localStorage.clear();

// Then refresh the page
location.reload();
```

---

## ✅ Success Indicators

If everything is working correctly, you should see:

1. **Admin Panel:**
   - ✅ Worksheet Builder in sidebar
   - ✅ Can create/edit/delete templates
   - ✅ Green indicator in task creation form
   - ✅ Can view submissions

2. **User Panel:**
   - ✅ Tasks show worksheet indicators
   - ✅ "Fill Worksheet" button works
   - ✅ Dynamic form renders correctly
   - ✅ Submissions save successfully

3. **Console:**
   - ✅ No errors
   - ✅ Success logs appear
   - ✅ Services are globally accessible

4. **localStorage:**
   - ✅ Templates saved correctly
   - ✅ Submissions saved correctly
   - ✅ Tasks have worksheet metadata

---

## 📊 Test Data Examples

### Sample Template JSON:
```json
{
  "id": "worksheet_1234567890",
  "name": "Code Review Checklist",
  "categoryId": "cat_123",
  "description": "Checklist for code review tasks",
  "fields": [
    {
      "id": "field_1234567890",
      "label": "Code Repository URL",
      "type": "text",
      "required": true,
      "placeholder": "https://github.com/...",
      "defaultValue": ""
    }
  ],
  "createdAt": "2025-10-29T...",
  "updatedAt": "2025-10-29T..."
}
```

### Sample Submission JSON:
```json
{
  "id": "submission_1234567890",
  "taskId": "task_123",
  "templateId": "worksheet_789",
  "userId": "user_456",
  "categoryId": "cat_123",
  "data": {
    "field_1": "https://github.com/example/auth",
    "field_2": "15",
    "field_3": "Approved",
    "field_4": "Great implementation"
  },
  "status": "submitted",
  "submittedAt": "2025-10-29T..."
}
```

---

## 🎯 Performance Testing

### Large Form Testing:
1. Create template with 20+ fields
2. Test form rendering speed
3. Test submission time
4. Check localStorage size

### Multiple Submissions:
1. Create 10+ submissions for one task
2. Test submission list loading
3. Test export functionality
4. Check memory usage

---

**Testing Status:** Ready for QA
**Last Updated:** October 29, 2025

