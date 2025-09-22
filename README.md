# Canadian Personal Finance Tracker

A comprehensive web application for tracking personal finances across multiple Canadian financial institutions with secure bank integration and automated transaction categorization.

## 🚀 Features

- **Multi-user Support**: Individual user profiles and data isolation
- **Canadian Bank Integration**: Support for major Canadian banks (RBC, TD, BMO, Scotiabank, CIBC, Tangerine)
- **Secure Authentication**: Firebase Authentication with 2FA support
- **Automated Categorization**: Smart transaction categorization
- **Interactive Reports**: Pie charts and detailed financial summaries
- **PIPEDA Compliant**: Adheres to Canadian privacy laws
- **Real-time Data**: Live transaction syncing with banking institutions

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Firebase Functions + Firestore
- **Authentication**: Firebase Auth
- **Banking Integration**: Playwright-based secure scraping
- **Charts**: Recharts
- **Testing**: Playwright MCP

### Project Structure
```
src/
├── components/           # Reusable UI components
├── pages/               # Main application pages
├── services/
│   ├── banking/         # Banking integration services
│   │   ├── adapters/    # Individual bank implementations
│   │   ├── base/        # Base interfaces and shared code
│   │   └── registry.ts  # Bank adapter registry
│   ├── auth/            # Firebase authentication
│   └── data/            # Data processing and categorization
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Development

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run firebase:emulators` - Start Firebase emulators

### Adding New Banks

1. Create adapter in `src/services/banking/adapters/[bank-name].ts`
2. Implement the `BankAdapter` interface
3. Register in `src/services/banking/registry.ts`
4. Test with Playwright MCP

Example adapter structure:
```typescript
export class NewBankAdapter extends BaseBankAdapter {
  readonly bankName = 'NewBank';
  readonly isSupported = true;
  readonly loginUrl = 'https://newbank.ca/login';

  async login(page: Page, credentials: SessionCredentials): Promise<void> {
    // Implementation
  }

  async getAccounts(page: Page): Promise<Account[]> {
    // Implementation
  }

  async getTransactions(page: Page, accountId: string, dateRange: DateRange): Promise<Transaction[]> {
    // Implementation
  }

  async logout(page: Page): Promise<void> {
    // Implementation
  }
}
```

### Security & Compliance

- **Never store banking credentials**: Use session-based authentication only
- **Encrypt sensitive data**: All PII is encrypted at rest
- **PIPEDA compliance**: Follow Canadian privacy laws
- **Audit logging**: All data access is logged
- **Regular security reviews**: Scheduled security assessments

## 🔒 Security Features

- **End-to-end encryption** for sensitive financial data
- **Session-based authentication** - no credential storage
- **Firestore security rules** for data access control
- **PIPEDA compliance** with explicit consent flows
- **Audit logging** for all financial data access

## 🧪 Testing

The application uses Playwright MCP for browser automation testing:

```bash
# Run specific bank adapter tests
npm test -- --grep "RBC"

# Run all integration tests
npm run test:integration

# Debug with Playwright
npm run test:debug
```

## 📊 Data Management

### Transaction Categories
- Housing (rent, utilities, insurance)
- Transportation (gas, transit, car payments)
- Food & Dining (groceries, restaurants)
- Entertainment & Recreation
- Healthcare & Medical
- Shopping & Personal Care
- Financial Services (fees, investments)
- Income (salary, freelance, benefits)
- Other/Miscellaneous

### Supported Banks
- RBC (Royal Bank of Canada)
- TD (Toronto-Dominion Bank)
- BMO (Bank of Montreal)
- Scotiabank
- CIBC (Canadian Imperial Bank of Commerce)
- Tangerine

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Environment Variables
Ensure all production environment variables are set:
- Firebase configuration
- Analytics IDs (optional)
- Security keys

## 📝 Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

### Bank Integration Best Practices
- Use Playwright MCP for testing
- Implement error handling for all bank interactions
- Respect banking website terms of service
- No rate limiting implementation required
- Graceful fallback for integration failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Run security and compliance checks
5. Submit pull request

## ⚖️ Legal & Compliance

This application adheres to:
- **PIPEDA** (Personal Information Protection and Electronic Documents Act)
- **Canadian banking regulations**
- **Open Banking framework** (when available)

## 📞 Support

For issues and questions:
- Check the CLAUDE.md file for development guidelines
- Review security documentation
- Follow the banking integration patterns

## 🔮 Future Enhancements

- Open Banking API integration (2026)
- Mobile application
- Advanced budgeting features
- Investment portfolio tracking
- Tax preparation integration

---

**⚠️ Important**: This application handles sensitive financial data. Always follow security best practices and comply with Canadian privacy laws.