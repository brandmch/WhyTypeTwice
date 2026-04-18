# Why Type Twice

A VS Code extension that auto-completes React `useState` destructuring so you don't have to.

## What it does

Type `const [count,` in any JS/TS/JSX/TSX file and the extension suggests the rest:

**Before:**
```tsx
const [count,
```

**After accepting the suggestion:**
```tsx
const [count, setCount] = useState()
//                                ^ cursor lands here
```

The extension reads your file's existing React import and matches the style automatically — no configuration needed.

| Import in file | Inserted |
|---|---|
| `import { useState } from 'react'` | `useState()` |
| `import React from 'react'` | `React.useState()` |
| `import * as React from 'react'` | `React.useState()` |
| `import React, { useState } from 'react'` | `useState()` |
| No React import | Adds `import { useState } from 'react'` then uses `useState()` |

To switch styles, just change your import — the extension follows your lead.

## Usage

1. Open any `.js`, `.ts`, `.jsx`, or `.tsx` file
2. Start typing a `useState` destructure: `const [myValue,`
3. Accept the **Why Type Twice** completion suggestion
4. Type your initial state value inside the parens

## Local development

```bash
git clone https://github.com/brandmch/WhyTypeTwice.git
cd WhyTypeTwice
npm install
npm run compile
```

Open the folder in VS Code and press `F5`. A second **Extension Development Host** window opens with the extension loaded and ready to test.

## License

MIT
