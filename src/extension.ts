import * as vscode from 'vscode';

const TRIGGER_PATTERN = /const\s+\[([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*$/;
const REACT_IMPORT_RE = /import\s+(.+?)\s+from\s+['"]react['"]/g;

type CallStyle = 'useState' | 'React.useState';

function detectCallStyle(document: vscode.TextDocument): { callStyle: CallStyle; needsImport: boolean } {
  const text = document.getText();
  let hasNamedUseState = false;
  let hasDefaultOrNamespace = false;

  REACT_IMPORT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = REACT_IMPORT_RE.exec(text)) !== null) {
    const clause = m[1].trim();
    if (/\{[^}]*\buseState\b[^}]*\}/.test(clause)) {
      hasNamedUseState = true;
    }
    if (/^React\b/.test(clause) || /^\*\s+as\s+React\b/.test(clause)) {
      hasDefaultOrNamespace = true;
    }
  }

  if (hasNamedUseState) { return { callStyle: 'useState', needsImport: false }; }
  if (hasDefaultOrNamespace) { return { callStyle: 'React.useState', needsImport: false }; }
  return { callStyle: 'useState', needsImport: true };
}

function importInsertPosition(document: vscode.TextDocument): vscode.Position {
  let lastImportLine = -1;
  for (let i = 0; i < document.lineCount; i++) {
    if (document.lineAt(i).text.trimStart().startsWith('import ')) {
      lastImportLine = i;
    }
  }
  return lastImportLine === -1
    ? new vscode.Position(0, 0)
    : new vscode.Position(lastImportLine + 1, 0);
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

        const config = vscode.workspace.getConfiguration('usestateSetter');
        const importStyle = config.get<string>('importStyle', 'autoDetect');

        let callExpr: string;
        let additionalEdits: vscode.TextEdit[] | undefined;

        if (importStyle === 'autoDetect') {
          const { callStyle, needsImport } = detectCallStyle(document);
          callExpr = callStyle;
          if (needsImport) {
            additionalEdits = [
              vscode.TextEdit.insert(
                importInsertPosition(document),
                "import { useState } from 'react';\n"
              ),
            ];
          }
        } else {
          callExpr = importStyle === 'useState' ? 'useState' : 'React.useState';
        }

        const snippetText = `${setterName}] = ${callExpr}(\${1:})`;
        const item = new vscode.CompletionItem(
          `${setterName}] = ${callExpr}()`,
          vscode.CompletionItemKind.Snippet
        );
        item.insertText = new vscode.SnippetString(snippetText);
        item.detail = 'Why Type Twice';
        item.documentation = new vscode.MarkdownString(
          `Completes the useState destructure:\n\`\`\`\nconst [${stateName}, ${setterName}] = ${callExpr}()\n\`\`\``
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
