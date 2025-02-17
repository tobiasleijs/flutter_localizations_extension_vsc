import * as vscode from "vscode";

const diagnosticCollection = vscode.languages.createDiagnosticCollection("unusedLocalizationKeys");

export async function unusedLocalizationDiagnostics() {

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return; }

    const localizationKeys = await findLocalizationKeys();

    const usedKeys = new Set(await findUsedLocalizationKeys([...localizationKeys.keys()]));

    const diagnostics: { [filePath: string]: vscode.Diagnostic[] } = {};

    for (const [key, locations] of localizationKeys.entries()) {
        if (!usedKeys.has(key)) {
            for (const { filePath, line, startIndex } of locations) {
                if (!diagnostics[filePath]) {
                    diagnostics[filePath] = [];
                }

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

async function findLocalizationKeys(): Promise<Map<string, { filePath: string; line: number; startIndex: number }[]>> {
    const files = await vscode.workspace.findFiles("**/*.arb");
    const localizationKeys = new Map<string, { filePath: string; line: number; startIndex: number }[]>();

    await Promise.all(
        files.map(async file => {
            const textBytes = await vscode.workspace.fs.readFile(file);
            const text = new TextDecoder("utf-8").decode(textBytes);
            const lines = text.split("\n");

            lines.forEach((line, index) => {
                const match = line.match(/"(.*?)"\s*:\s*"(.*?)"/);
                if (match) {
                    const key = match[1];
                    const startIndex = line.indexOf(`"${key}"`) + 1; // Adjust for the opening quote
                    if (!localizationKeys.has(key)) {
                        localizationKeys.set(key, []);
                    }
                    localizationKeys.get(key)?.push({ filePath: file.fsPath, line: index, startIndex });
                }
            });
        })
    );

    return localizationKeys;
}

async function findUsedLocalizationKeys(keys: string[]): Promise<string[]> {
    const usedKeys = new Set<string>();
    const files = await vscode.workspace.findFiles("**/*.dart");

    const regexMap = new Map<string, RegExp>();
    keys.forEach(key => regexMap.set(key, new RegExp(`\\.${key}\\b`, "g")));

    await Promise.all(
        files.map(async file => {
            const textBytes = await vscode.workspace.fs.readFile(file);
            const text = new TextDecoder("utf-8").decode(textBytes);

            for (const [key, regex] of regexMap) {
                if (regex.test(text)) {
                    usedKeys.add(key);
                }
            }
        })
    );

    return [...usedKeys];
}
