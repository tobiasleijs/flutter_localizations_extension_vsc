import * as vscode from "vscode";

const diagnosticCollection = vscode.languages.createDiagnosticCollection("unusedLocalizationKeys");

export async function unusedLocalizationDiagnostics() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    const localizationKeys = new Map<string, { filePath: string; line: number }[]>();
    await findLocalizationKeys(localizationKeys);

    const usedKeys = new Set(await findUsedLocalizationKeys([...localizationKeys.keys()]));

    const diagnostics: { [filePath: string]: vscode.Diagnostic[] } = {};

    for (const [key, locations] of localizationKeys.entries()) {
        if (!usedKeys.has(key)) {
            for (const { filePath, line } of locations) {
                if (!diagnostics[filePath]) {
                    diagnostics[filePath] = [];
                }

                const document = await vscode.workspace.openTextDocument(filePath);
                const text = document.lineAt(line).text;
                const startIndex = text.indexOf(key);
                const range = new vscode.Range(line, startIndex, line, startIndex + key.length);
                diagnostics[filePath].push(
                    new vscode.Diagnostic(range, `"Localization ${key} is not used in this project"`, vscode.DiagnosticSeverity.Warning)
                );
            }
        }
    }

    diagnosticCollection.clear();

    for (const [filePath, diags] of Object.entries(diagnostics)) {
        diagnosticCollection.set(vscode.Uri.file(filePath), diags);
    }
}

async function findLocalizationKeys(
    localizationKeys: Map<string, { filePath: string; line: number }[]>
): Promise<void> {
    const files = await vscode.workspace.findFiles("**/*.arb");

    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const lines = text.split("\n");

        lines.forEach((line, index) => {
            const match = line.match(/"(.*?)"\s*:\s*"(.*?)"/);
            if (match) {
                const key = match[1];
                if (!localizationKeys.has(key)) {
                    localizationKeys.set(key, []);
                }
                localizationKeys.get(key)?.push({ filePath: file.fsPath, line: index });
            }
        });
    }
}

async function findUsedLocalizationKeys(keys: string[]): Promise<string[]> {
    const usedKeys: string[] = [];
    const files = await vscode.workspace.findFiles("**/*.dart");

    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();

        for (const key of keys) {
            const regex = new RegExp(`\\.${key}`, "g");
            if (regex.test(text)) {
                usedKeys.push(key);
            }
        }
    }

    return usedKeys;
}