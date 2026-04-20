import * as vscode from 'vscode';

const TRIGGER_PATTERN = /const\s+\[([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*$/;

type CallStyle = 'useState' | 'React.useState';

interface ImportAnalysis {
  callStyle: CallStyle;
  edit?: vscode.TextEdit;
}

// Preserve character offsets by replacing comment text with spaces
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
    .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
}

function analyzeImports(document: vscode.TextDocument): ImportAnalysis {
  const raw = document.getText();
  const text = stripComments(raw);

  let hasNamedUseState = false;
  let hasDefaultOrNamespace = false;
  let mergeEdit: vscode.TextEdit | undefined;

  // Anchor to each `from 'react'` and walk back to its opening `import`.
  // This fixes a bug where [\s\S]+? would cross statement boundaries and
  // match the clause of an unrelated import (e.g. @mui/material) instead.
  const fromReactRE = /\bfrom\s+['"]react['"]/g;
  let fm: RegExpExecArray | null;

  while ((fm = fromReactRE.exec(text)) !== null) {
    const before = text.slice(0, fm.index);
    const importIdx = before.lastIndexOf('import ');
    if (importIdx === -1) { continue; }

    // Text from `import` up to (not including) `from 'react'`
    const clauseText = before.slice(importIdx);

    // Skip type imports
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
        let i = closeBraceOffset - 1;
        while (i >= 0 && /\s/.test(raw[i])) { i--; }
        const sep = raw[i] === ',' ? ' ' : ', ';
        mergeEdit = vscode.TextEdit.insert(
          document.positionAt(closeBraceOffset),
          `${sep}useState`
        );
      }
    }
  }

  if (hasNamedUseState) { return { callStyle: 'useState' }; }
  if (hasDefaultOrNamespace) { return { callStyle: 'React.useState' }; }
  if (mergeEdit) { return { callStyle: 'useState', edit: mergeEdit }; }

  // No React import at all — add a fresh one after the last import line
  let lastImportLine = -1;
  for (let i = 0; i < document.lineCount; i++) {
    if (document.lineAt(i).text.trimStart().startsWith('import ')) {
      lastImportLine = i;
    }
  }
  const insertPos = lastImportLine === -1
    ? new vscode.Position(0, 0)
    : new vscode.Position(lastImportLine + 1, 0);

  return {
    callStyle: 'useState',
    edit: vscode.TextEdit.insert(insertPos, "import { useState } from 'react';\n"),
  };
}

export function activate(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'javascript' },
      { language: 'javascriptreact' },
      { language: 'typescript' },
      { language: 'typescriptreact' },
    ],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.CompletionItem[] | undefined {
        const linePrefix = document.lineAt(position).text.slice(0, position.character);
        const match = TRIGGER_PATTERN.exec(linePrefix);
        if (!match) { return undefined; }

        const stateName = match[1];
        const setterName = 'set' + stateName.charAt(0).toUpperCase() + stateName.slice(1);

        const { callStyle, edit } = analyzeImports(document);
        const additionalEdits = edit ? [edit] : undefined;

        const snippetText = ` ${setterName}] = ${callStyle}(\${1:})`;
        const item = new vscode.CompletionItem(
          ` ${setterName}] = ${callStyle}()`,
          vscode.CompletionItemKind.Snippet
        );
        item.insertText = new vscode.SnippetString(snippetText);
        item.detail = 'Why Type Twice';
        item.documentation = new vscode.MarkdownString(
          `Completes the useState destructure:\n\`\`\`\nconst [${stateName}, ${setterName}] = ${callStyle}()\n\`\`\``
        );
        item.sortText = '0';
        item.preselect = true;

        if (additionalEdits) {
          item.additionalTextEdits = additionalEdits;
        }

        // Consume auto-inserted `]` to avoid `]]`
        const charAfterCursor = document.getText(
          new vscode.Range(position, position.translate(0, 1))
        );
        if (charAfterCursor === ']') {
          item.range = new vscode.Range(position, position.translate(0, 1));
        }

        return [item];
      },
    },
    ','
  );

  context.subscriptions.push(provider);
}

export function deactivate() {}
