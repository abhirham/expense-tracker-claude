# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Canadian Finance Tracker - Development Guide

## Project Overview
A comprehensive personal finance tracker for Canadian banking institutions featuring secure browser automation for bank integration, modular adapter architecture, and PIPEDA compliance.

## Essential Commands

### Development
- `npm run dev` - Start Vite development server
- `npm run build` - Production build (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally

### Quality Assurance
- `npm run typecheck` - TypeScript type checking without compilation
- `npm run lint` - ESLint with TypeScript rules and React hooks
- `npm test` - Run Vitest test suite
- `npm test -- --grep "BankName"` - Run tests for specific bank adapter

### Firebase
- `npm run firebase:emulators` - Start Firebase emulators (Auth:9099, Firestore:8080, Functions:5001, Hosting:5000)
- `npm run deploy` - Build and deploy to Firebase hosting

### Environment Setup
```bash
# Initial setup
npm install
cp .env.example .env
firebase login
firebase use --add [project-id]

# Development verification
npm run typecheck && npm run lint && npm test
npm run firebase:emulators
npm run dev
```

## Architecture Overview

### Banking Adapter Pattern
The core architecture revolves around a modular banking integration system using the Adapter pattern:

**BaseBankAdapter** (`src/services/banking/base/BankAdapter.ts`):
- Abstract base class providing common utilities (`waitForElement`, `safeClick`, `parseAmount`)
- Validation methods for accounts, transactions, and date ranges
- Error handling with screenshot capture for debugging
- Standardized Canadian date/amount parsing

**BankRegistry** (`src/services/banking/registry.ts`):
- Singleton pattern managing all bank adapters
- Dynamic registration/unregistration of bank implementations
- Feature tracking and status management
- Development helpers for testing and debugging

**Adapter Implementation Pattern**:
```typescript
export class NewBankAdapter extends BaseBankAdapter {
  readonly bankName = 'BankName';
  readonly isSupported = true;
  readonly loginUrl = 'https://bank.ca/login';

  async login(page: Page, credentials: SessionCredentials): Promise<void>
  async getAccounts(page: Page): Promise<Account[]>
  async getTransactions(page: Page, accountId: string, dateRange: DateRange): Promise<Transaction[]>
  async logout(page: Page): Promise<void>
}
```

### Technology Stack Integration
- **React 18** with functional components and hooks
- **TypeScript** for comprehensive type safety across banking, auth, and UI domains
- **Playwright** for browser automation (not Playwright MCP - use standard Playwright)
- **Firebase**: Authentication, Firestore, Functions, Hosting
- **Vite** for development and build tooling
- **Tailwind CSS** for styling
- **Vitest** for testing

### Data Flow Architecture
1. **Authentication**: Firebase Auth with session-based banking credentials
2. **Bank Integration**: Playwright browser automation through adapter pattern
3. **Data Processing**: Transaction categorization and Canadian banking format parsing
4. **Storage**: Firestore with user-isolated collections and encryption
5. **UI**: React components with context-based state management

## Key Implementation Patterns

### Bank Adapter Development
When implementing new bank adapters:

1. **Extend BaseBankAdapter** - inherits validation, parsing, and error handling
2. **Use provided utilities** - `safeClick()`, `waitForElement()`, `parseAmount()`, etc.
3. **Implement error handling** - catch Playwright errors and use `handleLoginError()`
4. **Register with BankRegistry** - enables discovery and status tracking
5. **Test with Playwright** - use browser automation for validation

### Transaction Processing
- **Amount parsing**: Handles Canadian currency formatting ($1,234.56, negative in parentheses)
- **Date processing**: Supports YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY formats
- **ID generation**: Deterministic IDs using account + date + amount + description hash
- **Category mapping**: Predefined Canadian financial categories

### Error Handling Strategy
- **BankingError classes** with structured error codes and context
- **Graceful degradation** for non-critical failures
- **Screenshot capture** in development for debugging
- **Structured logging** with bank name, operation, and context

## Critical Development Notes

### Banking Integration Requirements
- **No credentials storage** - session-based authentication only
- **2FA support** - manual interaction flows with extended timeouts
- **PIPEDA compliance** - explicit consent, data minimization, audit logging
- **Session management** - temporary tokens, no persistent banking data

### Testing Strategy
- **Vitest** for unit tests of utilities and adapters
- **Playwright** for browser automation testing (standard library, not MCP)
- **Firebase emulators** for integration testing
- **Bank-specific test suites** with mocked responses

### Security Patterns
- **Firestore security rules** enforce user data isolation
- **Client-side encryption** for sensitive account numbers
- **Audit logging** for all financial data access
- **Input validation** for all banking data parsing

### Firebase Configuration
The project uses comprehensive Firebase integration:
- **Hosting**: SPA routing with dist/ build output
- **Firestore**: User collections with security rules
- **Functions**: Server-side processing (if needed)
- **Emulators**: Complete local development environment

## Development Workflow

### Adding New Banks
1. Create adapter class extending `BaseBankAdapter`
2. Implement required methods using Playwright page automation
3. Use existing utilities for common operations
4. Test with emulators and real bank sites
5. Register adapter in `BankRegistry`

### Testing Bank Integrations
```bash
# Test specific bank
npm test -- --grep "RBC"

# Run with emulators
npm run firebase:emulators
npm test -- --integration

# Debug with browser
npm test -- --headed --debug
```

### Debugging Bank Issues
1. **Check screenshots** in development mode
2. **Use browser devtools** with Playwright inspector
3. **Verify selectors** against current bank website
4. **Test error scenarios** (invalid credentials, 2FA, maintenance)

## Type System Structure

The codebase uses comprehensive TypeScript types organized by domain:

- **Banking Types**: `Account`, `Transaction`, `BankAdapter`, `SessionCredentials`
- **User Management**: `User`, `AuthUser`, `AuthState`
- **Data Processing**: `TransactionParseResult`, `FinancialSummary`
- **UI Types**: `LoadingState`, `ErrorState`, `ApiResponse`
- **Compliance**: `AuditLog`, `AuditAction`

## Important Constraints

### What NOT to Do
- Never store banking passwords or credentials
- Never implement artificial rate limiting or delays
- Never break existing bank integrations when adding new ones
- Never commit sensitive configuration or test credentials
- Never use Playwright MCP - use standard Playwright library

### Canadian Banking Specifics
- Handle Canadian currency formatting ($, commas, CAD)
- Support French language interfaces (Quebec banks)
- Respect banking website terms of service
- Implement proper 2FA flows for Canadian banking security

### PIPEDA Compliance Requirements
- Explicit user consent for data collection
- Data minimization principles
- Right to access, correct, and delete data
- Breach notification procedures
- Audit trail for all data processing

This architecture enables secure, modular banking integration while maintaining Canadian regulatory compliance and providing a robust foundation for personal finance management.