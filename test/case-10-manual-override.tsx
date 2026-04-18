// Case 10: Manual setting override
// Expected: React.useState() regardless of what's imported
//
// Before testing:
//   1. Open VS Code Settings (Cmd/Ctrl+,)
//   2. Search for "usestateSetter.importStyle"
//   3. Set it to "React.useState"
//   4. Type `const [count,` on the blank line below
//   5. After testing, reset the setting back to "autoDetect"

import { useState } from 'react';

// ↓ type here
