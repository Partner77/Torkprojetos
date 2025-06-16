# AI-Powered Development Platform

## Overview

This is a full-stack web application that serves as an AI-powered development platform where multiple AI agents collaborate to build and manage software projects. The system features a React frontend with shadcn/ui components, Express.js backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React with TypeScript, Vite build system, Tailwind CSS styling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Real-time Communication**: WebSocket integration for live updates
- **AI Integration**: Placeholder architecture for AI service coordination

## Key Components

### Database Schema (`shared/schema.ts`)
- **Projects**: Core project entities with status tracking and token management
- **AI Agents**: Different types of AI agents (architect, frontend, backend, QA, DevOps)
- **Messages**: Communication log between users and AI agents
- **Project Files**: File system representation for project structure

### Backend Services
- **AI Coordinator**: Manages AI agent interactions and message processing
- **File Manager**: Handles project file operations and archive generation
- **Project Manager**: Manages project lifecycle, state capture/restoration
- **Storage Layer**: Abstraction for database operations with in-memory fallback

### Frontend Architecture
- **Component Library**: shadcn/ui components for consistent UI
- **State Management**: React Query for server state management
- **Real-time Updates**: WebSocket hooks for live communication
- **Routing**: Wouter for client-side routing

## Data Flow

1. **User Interaction**: Users interact through the chat interface
2. **WebSocket Communication**: Messages are sent via WebSocket to the server
3. **AI Coordination**: The AI coordinator processes messages and delegates to appropriate agents
4. **State Updates**: Real-time updates are broadcast to connected clients
5. **File Management**: Project files are managed through the file manager service
6. **Database Persistence**: All operations are persisted through the Drizzle ORM layer

## External Dependencies

### Core Framework Dependencies
- React 18 with TypeScript for frontend development
- Express.js for backend API server
- Drizzle ORM with PostgreSQL for data persistence
- Vite for development and build tooling

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- shadcn/ui component library for consistent design

### Development Tools
- TypeScript for type safety across the stack
- ESBuild for production bundling
- React Query for server state management
- WebSocket (ws) for real-time communication

### AI Integration (Placeholder)
- OpenAI API integration structure in place
- Hugging Face token support for alternative AI providers

## Deployment Strategy

The application is configured for deployment on Replit with:

- **Development**: `npm run dev` starts the development server with hot reload
- **Production Build**: `npm run build` creates optimized client and server bundles
- **Production Start**: `npm run start` runs the compiled production server
- **Database Migration**: `npm run db:push` applies schema changes to PostgreSQL

The Replit configuration includes:
- Node.js 20 runtime environment
- PostgreSQL 16 database provisioning
- Autoscale deployment target
- Port configuration for web access

## Changelog

```
Changelog:
- June 15, 2025. Initial setup with basic interface
- June 15, 2025. Fixed critical issues: Chat functionality working, AI coordination implemented, file system populated with real project structure
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
User feedback: "muita coisa porem infucional" - Focus on functionality over appearance, deliver working features
Priority: Functional systems over visual polish
```