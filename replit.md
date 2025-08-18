# Overview

This project is a comprehensive business management platform designed for Exterior Finishes, a siding business operating across residential and commercial divisions. It provides end-to-end capabilities for managing customer relationships, tracking projects, sales pipelines, proposals, contracts, team communication, and business analytics. The system aims to streamline all business operations from lead generation to project completion, centralizing management of customer interactions, sales processes, project execution, team collaboration, and business intelligence with a modern web interface and robust backend.

# User Preferences

Preferred communication style: Simple, everyday language.

Strategic Decisions:
- BlueBeam-style PDF editor: Moving to separate dedicated website for enhanced functionality, easier development, and professional-grade features
- Integration approach: Link from CRM to external editor for seamless workflow

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom design tokens.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod validation.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful API with conventional CRUD endpoints.
- **Middleware**: Express session management, authentication, and error handling.

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe database operations.
- **Schema Management**: Drizzle Kit for migrations and schema synchronization.
- **Session Storage**: PostgreSQL-based session store using `connect-pg-simple`.
- **Connection Pooling**: Neon serverless connection pooling.

## Authentication and Authorization
- **Primary System**: JWT authentication with httpOnly cookies.
- **Password Security**: `bcryptjs` for password hashing (salt rounds of 12).
- **Token Management**: 24-hour JWT expiry with automatic cookie clearing on logout.
- **Session Security**: httpOnly, SameSite=lax cookies.
- **Access Control**: Admin-only user registration, role-based permissions (admin/staff), division scoping.

## Database Schema Design
- **Users**: Authentication (id, email, password_hash, name, role, division_id) with admin/staff roles.
- **Divisions**: Business units (id, key ['mfnc'|'sfnc'|'rr'], name).
- **Customers**: Contact information (id, division_id, name, email, phone, address_json, notes).
- **Jobs**: Project tracking (id, customer_id, division_id, status, site_address_json, created_by).
- **Estimates**: Financial proposals (id, job_id, status, total_cents, lines_json).
- **Sessions**: Secure session storage.

## Core Business Logic
- **Division Management**: Separate residential and commercial operations.
- **Customer Lifecycle**: Creation, updates, and relationship tracking.
- **Sales Pipeline**: Lead → Contacted → Qualified → Proposal → Negotiation → Won/Lost workflow with Kanban visualization.
- **Proposal Management**: Create, send, track, and manage project proposals.
- **Contract Lifecycle**: Draft → Sent → Signed → Active → Completed contract management.
- **Job Workflow**: Planning → In Progress → Completed status flow.
- **Team Communication**: Channel-based messaging, direct messages, and real-time collaboration.
- **Contact Directory**: Comprehensive vendor, subcontractor, supplier, and internal team contact management.
- **Business Analytics**: Revenue tracking, performance metrics, customer insights, and operational reporting.
- **Activity Tracking**: Comprehensive audit logging across all business modules.

# External Dependencies

- **Database**: Neon PostgreSQL serverless database.
- **Authentication**: Replit OIDC service (maintained for compatibility).
- **UI Components**: Radix UI.
- **Styling**: Tailwind CSS.
- **Validation**: Zod.