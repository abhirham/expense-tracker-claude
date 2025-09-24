# Canadian Finance Tracker - File Documentation

## Core Application Files

**`src/main.tsx`** - Entry point that renders the React app with React.StrictMode

**`src/App.tsx`** - Main app component with routing, authentication guards, and protected routes

**`src/vite-env.d.ts`** - TypeScript declarations for Vite environment

## Type Definitions

**`src/types/index.ts`** - Comprehensive TypeScript definitions for:
- User management (User, AuthUser, AuthState)
- Banking integration (Account, Transaction, BankAdapter, SessionCredentials)
- Transaction categories and processing
- API responses and error handling
- Audit logging for PIPEDA compliance

## Authentication & Context

**`src/contexts/AuthContext.tsx`** - Firebase authentication context with Google OAuth, user document management in Firestore

**`src/hooks/useAuth.ts`** - Simple hook wrapper that exports the auth context

## Banking Architecture

**`src/services/banking/base/BankAdapter.ts`** - Abstract base class for bank integrations providing:
- Common utilities (waitForElement, safeClick, parseAmount)
- Canadian banking-specific parsers (currency, dates)
- Error handling with screenshot capture
- Validation methods for accounts/transactions

**`src/services/banking/registry.ts`** - Singleton registry managing all bank adapters:
- Dynamic registration/unregistration of bank implementations
- Feature tracking and status management
- Development helpers and statistics

## UI Components

**`src/components/Layout/Layout.tsx`** - Main layout with sidebar and header using React Router Outlet

**`src/components/Layout/Header.tsx`** - Top navigation header

**`src/components/Layout/Sidebar.tsx`** - Left navigation sidebar

**`src/components/UI/LoadingSpinner.tsx`** - Reusable loading spinner component

## Pages

**`src/pages/LoginPage.tsx`** - Google OAuth login page with error handling

**`src/pages/Dashboard.tsx`** - Main dashboard with financial overview cards and placeholder data

**`src/pages/AccountsPage.tsx`** - Account management interface

**`src/pages/TransactionsPage.tsx`** - Transaction history and management

**`src/pages/ReportsPage.tsx`** - Financial reporting interface

**`src/pages/SettingsPage.tsx`** - User settings and preferences

## Configuration

**`src/config/firebase.ts`** - Firebase configuration with emulator support for development

**`package.json`** - Dependencies including React, Firebase, Playwright, TypeScript, Tailwind CSS

**`tsconfig.json`** - TypeScript configuration

**`vite.config.ts`** - Vite build configuration

**`tailwind.config.js`** - Tailwind CSS configuration

## Project Structure

This is a **Canadian Finance Tracker** built with:
- **React 18** + TypeScript for the frontend
- **Firebase** for authentication, database, and hosting
- **Playwright** for browser automation to integrate with Canadian banks
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Modular banking adapter pattern** for adding new bank integrations

The app allows users to securely connect their Canadian bank accounts, import transactions, categorize spending, and generate financial reports while maintaining PIPEDA compliance.