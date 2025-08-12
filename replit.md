# Overview

This is a comprehensive business management platform built for Exterior Finishes, a siding business that operates across residential and commercial divisions. The application provides end-to-end management capabilities including customer relationships, project tracking, sales pipeline, proposals, contracts, team communication, and business analytics with a modern web interface and robust backend architecture.

The system features a React-based frontend with TypeScript, a Node.js Express backend, PostgreSQL database with Drizzle ORM, and JWT authentication. It's designed to streamline all aspects of business operations from lead generation through project completion, providing centralized management of customer interactions, sales processes, project execution, team collaboration, and business intelligence.

## Recent Changes (August 2025)
- ✅ Configured complete database schema with Drizzle ORM and Neon PostgreSQL
- ✅ Created five main tables: users, divisions, customers, jobs, estimates with proper foreign key relationships
- ✅ Implemented proper database migrations and seeding scripts with sample data
- ✅ Set up division-based routing with @tanstack/react-router (mfnc, sfnc, rr divisions)
- ✅ Built comprehensive app shell with header division switcher and sidebar navigation
- ✅ Created reusable DataTable and FormWrapper components for data management
- ✅ Implemented JWT authentication with httpOnly cookies and bcryptjs password hashing
- ✅ Created authentication routes: POST /api/auth/login, /logout, /register (admin-only), GET /api/auth/me
- ✅ Built sign-in page with React Hook Form and added logout functionality to app header
- ✅ Added authentication middleware and proper cookie management with 15-minute token expiry
- ✅ Implemented custom tRPC-like system with superjson transformer for type-safe API communication
- ✅ Created authentication context with createContext() that extracts JWT user from cookies
- ✅ Added role-based access control with requireAuthed() and requireRole('admin'|'staff') helpers
- ✅ Built division scoping helper that forces staff to their division, allows admin access to all divisions
- ✅ Implemented divisions endpoints: divisions.getAll() and divisions.getByKey() with proper authentication
- ✅ Created DivisionSwitcher component that fetches divisions via tRPC and updates route parameters
- ✅ Set up division-based navigation: /:division/customers | jobs | estimates with proper route handling
- ✅ Built comprehensive tRPC endpoints for customers, jobs, and estimates with full CRUD operations
- ✅ Added Zod validation schemas for all endpoints with proper input validation and type safety
- ✅ Implemented division scoping enforcement across all list/create/update operations
- ✅ Created typed DTOs suitable for tables and forms with proper error handling and status codes
- ✅ Added pagination support and filtering by status for list endpoints
- ✅ Enforced proper access control ensuring staff users only access their assigned divisions

### Major UI/UX Overhaul (January 2025)
- ✅ Completely modernized design system with professional slate color scheme and improved typography
- ✅ Enhanced Header and Sidebar components with clean layout and organized navigation sections
- ✅ Built professional DataTable component using TanStack React Table with search, sorting, and empty states
- ✅ Created comprehensive EmptyState component for better user experience across all modules
- ✅ Expanded navigation structure to include full business management capabilities
- ✅ Implemented Pipeline (Kanban lead management), Proposals, Contracts, Contacts, Communication, and Reports modules
- ✅ Added professional form designs with improved validation and user feedback
- ✅ Enhanced overall page layouts to utilize full screen space effectively with rich content

### Performance Optimization and Navigation Restructure (January 2025)
- ✅ Implemented lazy loading for all page components to reduce initial bundle size and improve load times
- ✅ Added intelligent caching with 5-10 minute stale times to prevent unnecessary API calls during navigation
- ✅ Created professional loading skeletons during page transitions for immediate user feedback
- ✅ Enhanced sidebar navigation with client-side routing using history API for faster transitions
- ✅ Built query configuration system for different data types with optimized cache settings
- ✅ Renamed "Pipeline" to "Lead Management" and consolidated Proposals and Contracts as tabs within it
- ✅ Created comprehensive Lead Management page with tabbed interface for Pipeline, Proposals, and Contracts
- ✅ Enhanced Team Communication page with real-time chat interface, channels, and direct messaging
- ✅ Fixed router validation to allow all business module sections including lead-management, contacts, communication, and reports
- ✅ Added "All Divisions" option to view combined data across all divisions for admin users
- ✅ Created comprehensive lead detail pages with tabbed interface for overview, activities, tasks, documents, notes, and timeline
- ✅ Implemented dynamic Kanban-style pipeline with drag-and-drop functionality for lead status management

### Business Management Platform Expansion (January 2025)
- ✅ Created Pipeline module with Kanban-style lead tracking and sales funnel visualization
- ✅ Built Proposals system for creating, sending, and tracking project estimates with status management
- ✅ Implemented Contracts module for managing agreements, signatures, and project deliverables
- ✅ Added Contacts directory for vendors, subcontractors, suppliers, internal team, and business partners
- ✅ Created Team Communication system with channels, direct messages, and real-time collaboration features
- ✅ Built comprehensive Reports dashboard with revenue analytics, performance metrics, and business insights
- ✅ Enhanced all modules with professional summary cards, rich data visualization, and actionable interfaces

### UI/UX and Branding Updates (August 2025)
- ✅ Implemented collapsible sidebar with smooth animations and toggle functionality
- ✅ Added hamburger menu button for sidebar control with professional hover states
- ✅ Integrated authentic Exterior Finishes logo image in header at optimal size
- ✅ Updated entire color scheme to coordinate with logo's blue palette (navy, blue-600, blue-700)
- ✅ Applied gradient styling to primary buttons and active navigation states
- ✅ Streamlined header design with larger logo display and clean layout
- ✅ Coordinated blue color theme across sidebar navigation, buttons, icons, and cards
- ✅ Reordered sidebar navigation: Lead Management first, Estimates second, Customers third, Field Management fourth
- ✅ Removed Jobs tab from navigation as requested by user
- ✅ Updated default routing to start with Lead Management instead of Customers

### PDF Annotation System Implementation (August 2025)
- ✅ Resolved all PDF.js library loading issues by implementing native browser PDF rendering
- ✅ Created professional BlueBeam-style PDF annotation editor using HTML5 iframe approach
- ✅ Built comprehensive tool palette with rectangle, circle, line, text, and measurement tools
- ✅ Implemented color picker and stroke width controls for annotation customization
- ✅ Added debug tools for PDF loading troubleshooting at `/debug-pdf` route
- ✅ Created working annotation overlay system with canvas drawing capabilities
- ✅ Established primary BlueBeam editor route at `/bluebeam-editor` for production use
- ✅ Successfully bypassed all PDF.js worker conflicts and version mismatch issues

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with conventional CRUD endpoints
- **Middleware**: Express session management, authentication middleware, and error handling
- **Development**: Hot reload with Vite integration and runtime error overlay

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **Connection Pooling**: Neon serverless connection pooling

## Authentication and Authorization
- **Primary System**: JWT authentication with httpOnly cookies (secure=false for local development)
- **Password Security**: bcryptjs for password hashing with salt rounds of 12
- **Token Management**: 15-minute JWT expiry with automatic cookie clearing on logout
- **Session Security**: httpOnly, SameSite=lax cookies with proper path and domain settings
- **Access Control**: Admin-only user registration, role-based permissions (admin/staff)
- **Fallback Support**: Replit OIDC integration maintained for compatibility (unused)

## Database Schema Design
- **Users**: Authentication (id, email, password_hash, name, role, division_id) with admin/staff roles
- **Divisions**: Business units (id, key ['mfnc'|'sfnc'|'rr'], name) for Multi-Family/Single-Family/Repair
- **Customers**: Contact information (id, division_id, name, email, phone, address_json, notes)
- **Jobs**: Project tracking (id, customer_id, division_id, status, site_address_json, created_by)  
- **Estimates**: Financial proposals (id, job_id, status, total_cents, lines_json)
- **Sessions**: Secure session storage for Replit authentication (required for auth)

## Core Business Logic
- **Division Management**: Separate residential and commercial operations (Multi-Family, Single-Family, Repair & Retrofit)
- **Customer Lifecycle**: Creation, updates, and relationship tracking with comprehensive contact management
- **Sales Pipeline**: Lead → Contacted → Qualified → Proposal → Negotiation → Won/Lost workflow with Kanban visualization
- **Proposal Management**: Create, send, track, and manage project proposals with approval workflows
- **Contract Lifecycle**: Draft → Sent → Signed → Active → Completed contract management with deliverable tracking
- **Job Workflow**: Planning → In Progress → Completed status flow with project milestone tracking
- **Team Communication**: Channel-based messaging, direct messages, and real-time collaboration features
- **Contact Directory**: Comprehensive vendor, subcontractor, supplier, and internal team contact management
- **Business Analytics**: Revenue tracking, performance metrics, customer insights, and operational reporting
- **Activity Tracking**: Comprehensive audit logging for all operations across all business modules

## External Dependencies

- **Database**: Neon PostgreSQL serverless database for primary data storage
- **Authentication**: Replit OIDC service for user authentication and authorization
- **UI Components**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Validation**: Zod for runtime type validation and schema definition
- **Development**: Replit development environment with integrated tooling