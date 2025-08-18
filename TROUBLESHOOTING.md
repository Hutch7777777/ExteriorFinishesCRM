# Troubleshooting Guide

## Delete Button Not Working

### Symptoms
- Click delete button (trash icon)
- Document remains visible in UI
- Server logs show 200 status for delete API calls
- No error messages in console

### Debug Steps
1. Open browser console (F12)
2. Navigate to lead with documents
3. Click delete button
4. Look for these console messages:
   - "DELETING DOCUMENT: [id]"
   - "DELETE SUCCESS: [data]"
   - "CURRENT CACHE DATA: [array]"
   - "OLD DATA IN CACHE UPDATE: [array]"
   - "NEW FILTERED DATA: [array]"

### Common Causes
1. **Cache Key Mismatch**: Query cache not being invalidated
2. **Data Structure Issues**: Cache data format different than expected
3. **Race Conditions**: UI updating before API completes
4. **Authentication**: 401/403 errors blocking operations

### Solutions
1. **Immediate Fix**: Optimistic updates (remove from UI instantly)
2. **Cache Management**: Force complete cache refresh
3. **Debugging**: Add extensive logging to track data flow
4. **Fallback**: Manual page refresh if needed

## Authentication Issues

### Symptoms
- 401 Unauthorized errors in console
- "Authentication required" messages
- Unable to load data

### Solutions
1. Navigate to `/login`
2. Enter valid credentials
3. Ensure JWT tokens are properly stored
4. Check cookie expiration

## Performance Issues

### Symptoms
- Slow page loads
- Multiple API calls
- UI freezing

### Solutions
1. Implement proper caching strategies
2. Use React Query for data management
3. Optimize bundle size with lazy loading