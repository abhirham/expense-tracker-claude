import { bankRegistry } from './registry';
import { TDBankAdapter } from './adapters/TDBankAdapter';

// Register all available bank adapters
const tdBankAdapter = new TDBankAdapter();
bankRegistry.register(tdBankAdapter);

// Export registry and services
export { bankRegistry };
export { TDBankAdapter };
export * from './base/BankAdapter';