export type CallStyle = 'useState' | 'React.useState';

export interface AnalysisResult {
  callStyle: CallStyle;
  edit?: {
    offset: number;
    text: string;
  };
}

export function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
    .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
}

export function analyzeImports(rawText: string): AnalysisResult {
  const text = stripComments(rawText);

  let hasNamedUseState = false;
  let hasDefaultOrNamespace = false;
  let mergeEdit: { offset: number; text: string } | undefined;

  const fromReactRE = /\bfrom\s+['"]react['"]/g;
  let fm: RegExpExecArray | null;

  while ((fm = fromReactRE.exec(text)) !== null) {
    const before = text.slice(0, fm.index);
    const importIdx = before.lastIndexOf('import ');
    if (importIdx === -1) { continue; }

    const clauseText = before.slice(importIdx);
    if (/^import\s+type[\s{]/.test(clauseText)) { continue; }

    const clauseMatch = /^import\s+([\s\S]+?)\s*$/.exec(clauseText);
    if (!clauseMatch) { continue; }

    const clause = clauseMatch[1];
    const isNamed = clause.includes('{');
    const hasUseState = /\{[\s\S]*\buseState\b[\s\S]*\}/.test(clause);
    const isDefaultOrNamespace =
      /^\s*React\b/.test(clause) || /^\s*\*\s+as\s+React\b/.test(clause);

    if (hasUseState) { hasNamedUseState = true; }
    if (isDefaultOrNamespace) { hasDefaultOrNamespace = true; }

    if (isNamed && !hasUseState && !mergeEdit) {
      const clauseStartInText = importIdx + clauseText.indexOf(clause);
      const closeBrace = clause.lastIndexOf('}');
      if (closeBrace !== -1) {
        const closeBraceOffset = clauseStartInText + closeBrace;
        // Walk back past whitespace to find the last non-whitespace char before `}`.
        // Insert after that char so `{ useEffect }` becomes `{ useEffect, useState }`
        // rather than `{ useEffect , useState}` (which inserting AT `}` would produce).
        let i = closeBraceOffset - 1;
        while (i >= 0 && /\s/.test(rawText[i])) { i--; }
        const sep = rawText[i] === ',' ? ' ' : ', ';
        mergeEdit = { offset: i + 1, text: `${sep}useState` };
      }
    }
  }

  if (hasNamedUseState) { return { callStyle: 'useState' }; }
  if (hasDefaultOrNamespace) { return { callStyle: 'React.useState' }; }
  if (mergeEdit) { return { callStyle: 'useState', edit: mergeEdit }; }

  const lines = rawText.split('\n');
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('import ')) {
      lastImportLine = i;
    }
  }

  let insertOffset = 0;
  if (lastImportLine >= 0) {
    for (let i = 0; i <= lastImportLine; i++) {
      insertOffset += lines[i].length + 1;
    }
  }

  return {
    callStyle: 'useState',
    edit: { offset: insertOffset, text: "import { useState } from 'react';\n" },
  };
}
