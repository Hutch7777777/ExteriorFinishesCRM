# Overview

This is a Customer Relationship Management (CRM) system built for Exterior Finishes, a siding business that operates across residential and commercial divisions. The application provides comprehensive management capabilities for customers, jobs, estimates, and divisions with a modern web interface and robust backend architecture.

The system features a React-based frontend with TypeScript, a Node.js Express backend, PostgreSQL database with Drizzle ORM, and Replit authentication integration. It's designed to streamline business operations by providing centralized tracking of customer interactions, project management, and financial estimates.

## Recent Changes (August 2025)
- ✅ Configured complete database schema with Drizzle ORM and Neon PostgreSQL
- ✅ Created five main tables: users, divisions, customers, jobs, estimates with proper foreign key relationships
- ✅ Implemented proper database migrations and seeding scripts with sample data
- ✅ Set up division-based routing with @tanstack/react-router (mfnc, sfnc, rr divisions)
- ✅ Built comprehensive app shell with header division switcher and sidebar navigation
- ✅ Created reusable DataTable and FormWrapper components for data management

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
- **Provider**: Replit OpenID Connect (OIDC) integration
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration
- **User Management**: Automatic user provisioning with profile data sync

## Database Schema Design
- **Users**: Authentication (id, email, password_hash, name, role, division_id) with admin/staff roles
- **Divisions**: Business units (id, key ['mfnc'|'sfnc'|'rr'], name) for Multi-Family/Single-Family/Repair
- **Customers**: Contact information (id, division_id, name, email, phone, address_json, notes)
- **Jobs**: Project tracking (id, customer_id, division_id, status, site_address_json, created_by)  
- **Estimates**: Financial proposals (id, job_id, status, total_cents, lines_json)
- **Sessions**: Secure session storage for Replit authentication (required for auth)

## Core Business Logic
- **Division Management**: Separate residential and commercial operations
- **Customer Lifecycle**: Creation, updates, and relationship tracking
- **Job Workflow**: Planning → In Progress → Completed status flow
- **Estimate Process**: Draft → Sent → Approved/Rejected workflow
- **Activity Tracking**: Comprehensive audit logging for all operations

## External Dependencies

- **Database**: Neon PostgreSQL serverless database for primary data storage
- **Authentication**: Replit OIDC service for user authentication and authorization
- **UI Components**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Validation**: Zod for runtime type validation and schema definition
- **Development**: Replit development environment with integrated tooling