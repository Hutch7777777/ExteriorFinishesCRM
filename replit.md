# Overview

This is a Customer Relationship Management (CRM) system built for Exterior Finishes, a siding business that operates across residential and commercial divisions. The application provides comprehensive management capabilities for customers, jobs, estimates, and divisions with a modern web interface and robust backend architecture.

The system features a React-based frontend with TypeScript, a Node.js Express backend, PostgreSQL database with Drizzle ORM, and Replit authentication integration. It's designed to streamline business operations by providing centralized tracking of customer interactions, project management, and financial estimates.

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
- **Users**: Authentication and profile information
- **Divisions**: Residential and commercial business units
- **Customers**: Contact information and division association
- **Jobs**: Project tracking with status management
- **Estimates**: Financial proposals with approval workflow
- **Activity Log**: Audit trail for business operations
- **Sessions**: Secure session storage for authentication

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