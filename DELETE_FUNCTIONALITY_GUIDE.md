# Delete Functionality Implementation Guide

## ✅ ACCEPTANCE CRITERIA (MUST WORK)

When user clicks the red delete button (trash icon) on a document:

1. **Immediate UI Response**: Document disappears from the UI instantly
2. **API Success**: Backend deletion succeeds (200 status)
3. **Database Update**: Document is permanently removed from database
4. **No Page Refresh**: UI updates without requiring page reload
5. **Other Documents Intact**: Other documents remain visible and functional

## 🔧 TECHNICAL IMPLEMENTATION

### File: `client/src/pages/LeadDetail.tsx`

#### Delete Button Location (Lines 983-1001)
```jsx
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    console.log('🖱️ DELETE BUTTON CLICKED for document:', doc.id);
    deleteDocumentMutation.mutate(doc.id);
  }}
  disabled={deleteDocumentMutation.isPending}
  className="text-red-600 hover:text-red-700 disabled:opacity-50"
  data-testid="delete-document"
  data-document-id={doc.id}
  title="Delete document"
>
```

#### Delete Mutation (Lines 118-171)
- **Optimistic Updates**: Document removed from UI immediately on click
- **Error Handling**: Rollback if API call fails
- **Comprehensive Logging**: Emoji-coded console logs for debugging

## 🧪 TESTING INSTRUCTIONS

### Manual Testing
1. Navigate to a lead with documents: `/[division]/lead-management` → click any lead
2. Upload a document if none exist
3. Click the red trash icon on any document
4. Verify document disappears immediately
5. Check browser console for success logs

### Console Testing
```javascript
// Run in browser console
testDeleteFunctionality()
```

### Debug Logs to Look For
- 🖱️ DELETE BUTTON CLICKED for document: [id]
- 🗑️ DELETING DOCUMENT: [id]
- 🔄 OPTIMISTIC DELETE for: [id]
- 📸 SNAPSHOT DATA: [array]
- ✂️ OPTIMISTIC FILTERED: [array]
- ✅ DELETE SUCCESS: [data]

## 🐛 TROUBLESHOOTING

### Issue: Button Click Not Triggering
- **Check**: Button has `data-testid="delete-document"`
- **Check**: onClick handler is properly bound
- **Check**: Button is not disabled

### Issue: UI Not Updating
- **Check**: Optimistic update in `onMutate` is working
- **Check**: Cache key matches: `['/api/trpc/documents.getByLeadId', leadId]`
- **Check**: Document filtering logic is correct

### Issue: API Call Failing
- **Check**: User is authenticated (401/403 errors)
- **Check**: Document ID is valid
- **Check**: Server endpoint is responding

## 📝 RECENT FIXES

- ✅ Implemented optimistic updates for instant UI response
- ✅ Added comprehensive error handling with rollback
- ✅ Enhanced debugging with emoji-coded console logs
- ✅ Added proper test attributes for automation
- ✅ Created troubleshooting documentation