# Project Structure & Guidelines

## Entry Points
- **Frontend**: `client/src/App.tsx` - Main React application entry
- **Backend**: `server/index.ts` - Express server entry
- **Database**: `shared/schema.ts` - Database schema definitions
- **Routes**: `server/routes.ts` - API endpoint definitions

## Directory Organization

### `/client/src/`
- `components/` - Reusable UI components
- `pages/` - Route-specific page components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and configurations

### `/server/`
- `routers/` - tRPC router definitions
- `auth.ts` - Authentication logic
- `storage.ts` - Database operations
- `routes.ts` - Express route handlers

### `/shared/`
- `schema.ts` - Database schema (Drizzle ORM)
- Common types and interfaces

## Critical Issues to Fix

### 1. Delete Button Functionality
**Problem**: Documents not disappearing from UI when delete button clicked
**Root Cause**: Cache invalidation timing and data structure mismatch
**Fix Required**: Immediate optimistic updates + proper cache management

### 2. Authentication Flow
**Problem**: 401 errors preventing API access
**Root Cause**: Session management issues
**Fix Required**: Proper JWT token handling

### 3. Code Quality Standards
**Missing**: ESLint, Prettier, TypeScript strict mode
**Required**: Consistent formatting and error checking

## Acceptance Criteria for Delete Functionality

✅ **MUST WORK**: When user clicks delete icon on document
1. Document disappears immediately from UI
2. API call succeeds (200 status)
3. Document is removed from database
4. No page refresh required
5. Other documents remain visible

## File-Specific Responsibilities

### `client/src/pages/LeadDetail.tsx`
- Document display and management
- Delete button click handlers
- Cache management for document operations

### `server/routers/appRouter.ts`
- Document CRUD operations
- Proper error handling
- Authentication middleware

### `server/storage.ts`
- Database document operations
- Proper deletion logic