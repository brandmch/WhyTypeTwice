import * as assert from 'assert';
import { analyzeImports } from '../importAnalyzer';

describe('analyzeImports', () => {
  it('returns useState when named useState import exists', () => {
    const src = `import { useState } from 'react';\nconst x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.strictEqual(result.edit, undefined);
  });

  it('returns React.useState for default React import', () => {
    const src = `import React from 'react';\nconst x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'React.useState');
    assert.strictEqual(result.edit, undefined);
  });

  it('returns React.useState for namespace * as React import', () => {
    const src = `import * as React from 'react';\nconst x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'React.useState');
    assert.strictEqual(result.edit, undefined);
  });

  it('merges useState into existing named react import (no trailing comma)', () => {
    const src = `import { useEffect } from 'react';\nconst x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.ok(result.edit, 'expected a merge edit');
    assert.strictEqual(result.edit!.text, ', useState');
    const patched =
      src.slice(0, result.edit!.offset) + result.edit!.text + src.slice(result.edit!.offset);
    assert.ok(patched.includes('{ useEffect, useState }'));
  });

  it('merges useState with single space when trailing comma present', () => {
    const src = `import { useEffect, } from 'react';\nconst x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.ok(result.edit, 'expected a merge edit');
    assert.strictEqual(result.edit!.text, ' useState');
  });

  it('does not confuse MUI import with React default import', () => {
    const src = `import { Box } from '@mui/material';\nimport React from 'react';\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'React.useState');
    assert.strictEqual(result.edit, undefined);
  });

  it('uses useState when MUI + named useState import present', () => {
    const src = `import { Box } from '@mui/material';\nimport { useState } from 'react';\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.strictEqual(result.edit, undefined);
  });

  it('merges into React named import, not MUI import', () => {
    const src = `import { Box } from '@mui/material';\nimport { useEffect } from 'react';\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.ok(result.edit, 'expected a merge edit');
    const patched =
      src.slice(0, result.edit!.offset) + result.edit!.text + src.slice(result.edit!.offset);
    assert.ok(patched.includes("import { useEffect, useState } from 'react'"));
    assert.ok(patched.includes("import { Box } from '@mui/material'"));
  });

  it('inserts new import after last existing import when no React import exists', () => {
    const src = `import { something } from 'somewhere';\nconst x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.ok(result.edit, 'expected an insert edit');
    assert.strictEqual(result.edit!.text, "import { useState } from 'react';\n");
    const patched =
      src.slice(0, result.edit!.offset) + result.edit!.text + src.slice(result.edit!.offset);
    assert.ok(patched.includes("import { useState } from 'react';"));
    assert.ok(
      patched.indexOf('import { something }') < patched.indexOf('import { useState }')
    );
  });

  it('inserts new import at offset 0 when no imports exist at all', () => {
    const src = `const x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.ok(result.edit, 'expected an insert edit');
    assert.strictEqual(result.edit!.offset, 0);
    assert.strictEqual(result.edit!.text, "import { useState } from 'react';\n");
  });

  it('ignores type-only react imports', () => {
    const src = `import type { FC } from 'react';\nconst x = 1;\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.ok(result.edit, 'expected an insert edit');
    assert.strictEqual(result.edit!.text, "import { useState } from 'react';\n");
  });

  it('handles useState among multiple named imports', () => {
    const src = `import { useEffect, useState, useRef } from 'react';\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.strictEqual(result.edit, undefined);
  });

  it('ignores imports commented out with //', () => {
    const src = `// import React from 'react';\nimport { useState } from 'react';\n`;
    const result = analyzeImports(src);
    assert.strictEqual(result.callStyle, 'useState');
    assert.strictEqual(result.edit, undefined);
  });
});
