import * as vscode from 'vscode';

// Matches: const [someName,   (optional whitespace after comma, cursor expected next)
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
        if (!match) {
          return undefined;
        }

        const stateName = match[1];
        const setterName = 'set' + stateName.charAt(0).toUpperCase() + stateName.slice(1);

        const config = vscode.workspace.getConfiguration('usestateSetter');
        const importStyle = config.get<string>('importStyle', 'React.useState');
        const callExpr = importStyle === 'useState' ? 'useState' : 'React.useState';

        // Snippet: setVarName] = CallExpr(${1:}) — cursor lands inside parens
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
        // High sort priority so it floats to the top
        item.sortText = '0';
        item.preselect = true;

        return [item];
      },
    },
    // Trigger on comma so the completion fires as soon as the user types `const [name,`
    ','
  );

  context.subscriptions.push(provider);
}

export function deactivate() {}
