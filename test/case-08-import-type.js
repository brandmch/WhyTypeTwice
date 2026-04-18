// Case 8: `import type` only (should be ignored)
// Expected: treated as no React import → adds `import { useState } from 'react'` and uses useState()
//
// Type `const [count,` on the blank line below:

import type { FC } from 'react';

// ↓ type here
