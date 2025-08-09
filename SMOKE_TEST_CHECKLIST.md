# Smoke Test Checklist - Exterior Finishes CRM

## Environment Setup

### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Authentication (Set via Replit Secrets)
JWT_SECRET=your-super-secret-jwt-key-here

# Optional - Admin User Configuration (for seeding)
ADMIN_EMAIL=admin@exteriorfinishes.com
ADMIN_PASSWORD=admin123
```

### CORS Configuration
- ✅ Server configured with CORS for localhost ports (3000, 5173, 127.0.0.1:3000, 127.0.0.1:5173)
- ✅ Credentials enabled for authentication cookies

## Database Setup & Scripts

### 1. Run Database Migration
```bash
npm run db:migrate
# OR
npm run db:push
```
**Expected Result:** Database tables created (users, divisions, customers, jobs, estimates, sessions)

### 2. Run Database Seeding
```bash
npm run db:seed
```
**Expected Result:** 
- 3 divisions created (MFNC, SFNC, RR)
- 4 users created (1 admin, 3 staff)
- 4 sample customers
- 4 sample jobs
- 4 sample estimates

**Login Credentials:**
- Admin: `admin@exteriorfinishes.com` / `admin123`
- MFNC Staff: `mfnc.staff@exteriorfinishes.com` / `staff123`
- SFNC Staff: `sfnc.staff@exteriorfinishes.com` / `staff123`
- RR Staff: `rr.staff@exteriorfinishes.com` / `staff123`

## Application Startup

### 3. Start Server and Client
```bash
npm run dev
```
**Expected Result:** 
- Express server running on port 5000
- Vite dev server integrated
- No CORS errors in browser console

## Authentication Flow

### 4. Sign In with Admin User
- [ ] Navigate to application root
- [ ] Enter admin credentials: `admin@exteriorfinishes.com` / `admin123`
- [ ] Successful login redirects to CRM dashboard
- [ ] Header shows "Exterior Finishes CRM" and logout button
- [ ] Division switcher visible in header

**Expected Result:** Successful authentication with admin access to all divisions

### 5. Division Switching (Admin Only)
- [ ] Click division switcher in header
- [ ] Verify all divisions visible: "Multi-Family New Construction", "Single-Family New Construction", "Repair & Retrofit"
- [ ] Select different division
- [ ] URL updates to `/{division}/customers`
- [ ] Data refreshes for selected division

**Expected Result:** Admin can switch between all divisions, staff users see only their division

## Core CRUD Operations

### 6. Customers Management
**In each division (MFNC, SFNC, RR):**

#### List View
- [ ] Navigate to `/{division}/customers`
- [ ] DataTable loads with sample customers
- [ ] Search functionality works (try customer names)
- [ ] "Add Customer" button visible

#### Create Flow
- [ ] Click "Add Customer" button
- [ ] Dialog opens with form fields (Name*, Email, Phone, Notes)
- [ ] Fill required field (Name) and submit
- [ ] Success toast appears
- [ ] New customer appears in table
- [ ] Dialog closes automatically

#### Edit Flow
- [ ] Click Edit button (pencil icon) on any customer row
- [ ] Navigates to `/{division}/customers/edit/{id}`
- [ ] Form pre-populated with customer data
- [ ] Modify customer information
- [ ] Click "Update Customer"
- [ ] Success toast appears
- [ ] Returns to customer list
- [ ] Changes reflected in table

### 7. Jobs Management
**In each division:**

#### List View
- [ ] Navigate to `/{division}/jobs`
- [ ] DataTable loads with sample jobs
- [ ] Status filter dropdown works (Planning, In Progress, Completed)
- [ ] Customer names display correctly
- [ ] Status badges show correct colors
- [ ] "Create Job" button visible

#### Create Flow
- [ ] Click "Create Job" button
- [ ] Dialog opens with Customer dropdown and Status selection
- [ ] Customer dropdown populated with division customers
- [ ] Select customer and status
- [ ] Submit form
- [ ] Success toast appears
- [ ] New job appears in table

#### Edit Flow
- [ ] Click Edit button on any job row
- [ ] Shows "Edit Job (Coming Soon)" placeholder
- [ ] Navigation works correctly

### 8. Estimates Management
**In each division:**

#### List View
- [ ] Navigate to `/{division}/estimates`
- [ ] DataTable loads with sample estimates
- [ ] Status filter works (Draft, Sent, Approved, Rejected)
- [ ] Currency formatting displays correctly ($1,250,000.00)
- [ ] Customer names show from job relationships
- [ ] "Create Estimate" button visible

#### Create Flow
- [ ] Click "Create Estimate" button
- [ ] Dialog opens with Job dropdown, Total Amount, and Status
- [ ] Job dropdown shows "Customer Name - Status" format
- [ ] Enter dollar amount (converts to cents automatically)
- [ ] Select status and submit
- [ ] Success toast appears
- [ ] New estimate appears with correct currency formatting

#### Edit Flow
- [ ] Click Edit button on any estimate row
- [ ] Shows "Edit Estimate (Coming Soon)" placeholder
- [ ] Navigation works correctly

## Data Persistence & Division Scoping

### 9. Database Persistence
- [ ] Create a customer, job, and estimate
- [ ] Refresh the browser
- [ ] All created items still appear in their respective tables
- [ ] Data persists across page reloads

### 10. Staff User Division Restrictions
**Test with staff credentials:**

#### MFNC Staff Test
- [ ] Logout admin user
- [ ] Login as `mfnc.staff@exteriorfinishes.com` / `staff123`
- [ ] Division switcher NOT visible (staff can't switch)
- [ ] Can only see MFNC division data
- [ ] Cannot access `/sfnc/` or `/rr/` URLs (should redirect or show error)
- [ ] Can create/edit customers, jobs, estimates in MFNC only

#### Division Data Isolation
- [ ] Login as SFNC staff: `sfnc.staff@exteriorfinishes.com` / `staff123`
- [ ] Verify only SFNC customers/jobs/estimates visible
- [ ] Data from other divisions not accessible
- [ ] Creating new records assigns to SFNC division automatically

## Error Handling & Edge Cases

### 11. Authentication Errors
- [ ] Try accessing CRM pages without login (should redirect to sign-in)
- [ ] Invalid login credentials show error message
- [ ] Session expiry (wait 15 minutes) redirects to login

### 12. Form Validation
- [ ] Submit customer form without required name (shows validation error)
- [ ] Enter invalid email format (shows validation error)
- [ ] Try negative amounts in estimates (shows validation error)

### 13. API Error Handling
- [ ] Network errors show appropriate error toasts
- [ ] Loading states display during API calls
- [ ] Failed operations don't corrupt application state

## Performance & UI

### 14. Loading States
- [ ] Tables show skeleton loading while fetching data
- [ ] Form submissions show loading indicators
- [ ] Buttons disable during pending operations

### 15. Responsive Design
- [ ] Application works on different screen sizes
- [ ] Tables scroll horizontally on mobile if needed
- [ ] Dialogs display properly on small screens

## Final Verification

### 16. Complete Workflow Test
**As Admin:**
- [ ] Switch to MFNC division
- [ ] Create new customer
- [ ] Create job for that customer
- [ ] Create estimate for that job
- [ ] Edit customer information
- [ ] Verify all data persists and relationships work

**As Staff:**
- [ ] Login as division staff user
- [ ] Verify can only access assigned division
- [ ] Create customer/job/estimate in their division
- [ ] Verify admin can see the staff-created data
- [ ] Verify other division staff cannot see this data

## Success Criteria

**✅ All tests passing indicates:**
- Database schema and relationships working correctly
- Authentication and authorization functioning properly
- Division-based access control implemented correctly
- CRUD operations persist to database
- Frontend forms integrate properly with tRPC backend
- Role-based permissions enforced (admin vs staff)
- Data isolation between divisions maintained
- Error handling and validation working as expected

## Troubleshooting

**Common Issues:**
- **CORS errors:** Check server CORS configuration includes your frontend URL
- **Database connection:** Verify DATABASE_URL environment variable
- **Authentication fails:** Ensure JWT_SECRET is set in Replit Secrets
- **Division access:** Confirm user roles and division assignments in database
- **tRPC errors:** Check server logs for detailed error messages

**Debug Commands:**
```bash
# Check database schema
npm run db:studio

# View server logs
npm run dev

# Test API endpoints directly
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exteriorfinishes.com","password":"admin123"}'
```