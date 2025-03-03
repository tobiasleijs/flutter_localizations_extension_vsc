import * as vscode from 'vscode';


export class UnusedLocalizationCodeActionProvider implements vscode.CodeActionProvider {
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        const diagnosticsInDocument = vscode.languages.getDiagnostics(document.uri);

        const unusedLocalizationDiagnostics = diagnosticsInDocument.filter(
            (diagnostic) => diagnostic.message.startsWith('Localization key "')
        );

        const keys = unusedLocalizationDiagnostics.map((diagnostic) => {
            const match = diagnostic.message.match(/"(.+?)"/);
            return match ? match[1] : null;
        }).filter(Boolean);

        for (const diagnostic of context.diagnostics) {
            if (!diagnostic.message.startsWith('Localization key "')) {
                continue;
            }

            const match = diagnostic.message.match(/"(.+?)"/);
            if (!match) {
                continue;
            }

            const key = match[1];

            const fix = new vscode.CodeAction(
                `Remove unused localization: ${key}`,
                vscode.CodeActionKind.QuickFix
            );

            fix.command = {
                title: `Remove unused localization: ${key}`,
                command: "extension.removeUnusedLocalizationKey",
                arguments: [document.uri, key]
            };

            fix.diagnostics = [diagnostic];

            actions.push(fix);
        }

        if (keys.length > 0) {
            const removeAllKeysFix = new vscode.CodeAction(
                `Remove all unused localizations`,
                vscode.CodeActionKind.QuickFix
            );

            removeAllKeysFix.command = {
                title: `Remove all unused localizations`,
                command: "extension.removeAllUnusedLocalizationKeys",
                arguments: [document.uri, keys]
            };

            actions.push(removeAllKeysFix);
        }

        return actions;
    }
}


