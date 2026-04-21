import * as vscode from 'vscode';
import { analyzeImports } from './importAnalyzer';

const TRIGGER_PATTERN = /const\s+\[([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*$/;

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

        const raw = document.getText();
        const { callStyle, edit } = analyzeImports(raw);

        let additionalEdits: vscode.TextEdit[] | undefined;
        if (edit) {
          additionalEdits = [vscode.TextEdit.insert(document.positionAt(edit.offset), edit.text)];
        }

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
