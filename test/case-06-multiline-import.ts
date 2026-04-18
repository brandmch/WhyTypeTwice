// Case 6: Multi-line named import without useState
// Expected: completion uses useState() AND merges useState before closing }
// Result: the import block gains useState on a new line
//
// Type `const [count,` on the blank line below:

import {
  useEffect,
  useCallback,
} from 'react';

// ↓ type here
