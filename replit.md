# replit.md

## Overview

This is a full-stack web application called "Harmony.ai" - an AI-powered professional networking platform. The application provides a LinkedIn-like experience with features for professional networking, job searching, community building, and AI-enhanced content recommendations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and express-session
- **File Uploads**: Multer for handling profile images and documents
- **AI Integration**: Anthropic Claude SDK for AI-powered features

### Database Architecture
- **ORM**: Drizzle with PostgreSQL dialect
- **Connection**: Neon serverless PostgreSQL
- **Session Store**: PostgreSQL-based session storage
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### Authentication System
- Local username/password authentication
- Session-based authentication with PostgreSQL storage
- Separate admin authentication system
- Password hashing using Node.js crypto (scrypt)
- Role-based access control (regular users vs recruiters)

### User Management
- User profiles with skills, experience, and education
- Profile image uploads
- Digital CV functionality
- Privacy settings for profile visibility
- Two-factor authentication support (prepared)

### Professional Networking
- Connection requests and management
- Real-time messaging system
- User discovery and search
- Professional communities

### Job Board System
- Job posting and application management
- AI-powered job recommendations
- Applicant tracking system for recruiters
- Saved jobs functionality
- Company profiles and management

### Content Management
- Post creation with image uploads
- Like and comment system
- Community-based content
- AI-powered post suggestions
- Anonymous posting options

### AI Features
- Video resume analysis
- Personalized job recommendations
- Post content enhancement
- Professional tip generation

## Data Flow

1. **Authentication Flow**: User login → Passport.js authentication → Session creation → Database session storage
2. **Content Flow**: User creates content → Validation → Database storage → Real-time updates via React Query
3. **AI Flow**: User requests AI features → Anthropic API → Processed response → User interface
4. **File Upload Flow**: User uploads files → Multer processing → Local file storage → Database URL reference

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **AI Services**: Anthropic Claude API for AI features
- **Authentication**: Express-session with connect-pg-simple
- **File Processing**: Multer for file uploads
- **Validation**: Zod for runtime type checking

### UI Dependencies
- **Component Library**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React icons
- **Forms**: React Hook Form with Hookform resolvers

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **Development Server**: Vite dev server with Express backend
- **Ports**: Frontend on 5001, Backend on 5000

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push`
- **Deployment**: Replit autoscale deployment target

### Environment Configuration
- Database URL from environment variables
- Session secrets for authentication
- API keys for external services (Anthropic)
- File upload directories created dynamically

## Changelog

- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.