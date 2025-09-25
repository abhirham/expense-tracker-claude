import { bankRegistry } from './registry.js';
import { TDBankAdapter } from './adapters/TDBankAdapter.js';

// Initialize and register all bank adapters
console.log('Initializing banking adapters...');

// Register TD Bank adapter
const tdAdapter = new TDBankAdapter();
bankRegistry.register(tdAdapter);

console.log('Banking adapters initialized successfully');

export { bankRegistry };