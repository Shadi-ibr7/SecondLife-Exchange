import '@testing-library/jest-dom';

// IndexedDB polyfill pour les tests unitaires (queue offline)
import 'fake-indexeddb/auto';

// Polyfill pour structuredClone (utilisé par fake-indexeddb selon l'environnement)
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}

import '@testing-library/jest-dom';

