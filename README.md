# Why Type Twice

A VS Code extension that auto-completes React `useState` destructuring so you don't have to.

## What it does

Type `const [count,` in any JS/TS/JSX/TSX file and the extension suggests:

```ts
const [count, setCount] = React.useState()
//                                        ^ cursor lands here
```

Accept the suggestion, type your initial value, done. No more manually typing the setter name or the hook call.

## Usage

1. Open any `.js`, `.ts`, `.jsx`, or `.tsx` file
2. Start a useState destructure: `const [myValue,`
3. Accept the **Why Type Twice** completion suggestion
4. Type the initial state value inside the parens

## Settings

| Setting | Options | Default | Description |
|---|---|---|---|
| `usestateSetter.importStyle` | `React.useState` \| `useState` | `React.useState` | Controls the hook call style in the inserted snippet |

**`React.useState`** — use this if your file imports React as a default import:
```ts
import React from 'react';
```

**`useState`** — use this if your file uses named imports:
```ts
import { useState } from 'react';
```

## Development

```bash
npm install
npm run compile
```

Press `F5` in VS Code to launch the extension in a new Extension Development Host window.

## License

MIT
