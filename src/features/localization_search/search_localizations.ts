import * as vscode from "vscode";

export const localizationFinder = vscode.commands.registerCommand(
    "flutterLocalizationSearch.findLocalization",
    async () => {

        const searchString = await vscode.window.showInputBox({
            prompt: "Enter the localized string or key to search for",
        });

        if (!searchString) { return; };

        const lowerCaseSearchString = searchString.toLowerCase();

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace open.");
            return;
        }

        const localizationKeys = await findLocalizationKeys();

        const matchedKeys = [...localizationKeys.entries()].filter(
            ([key, values]) =>
                key.toLowerCase().includes(lowerCaseSearchString) ||
                values.some(value => value.toLowerCase().includes(lowerCaseSearchString))
        );

        if (matchedKeys.length === 0) {
            vscode.window.showInformationMessage("No matching localization key found.");
            return;
        }

        await findKeyUsagesForMultipleKeys(matchedKeys.map(([key]) => key), searchString);
    }
);

async function findLocalizationKeys(): Promise<Map<string, string[]>> {
    const files = await vscode.workspace.findFiles("**/*.arb");
    const localizationKeys = new Map<string, string[]>();

    await Promise.all(
        files.map(async file => {
            const textBytes = await vscode.workspace.fs.readFile(file);
            const text = new TextDecoder("utf-8").decode(textBytes);
            const matches = text.matchAll(/"(.*?)"\s*:\s*"(.*?)"/gi);

            for (const match of matches) {
                const key = match[1];
                const value = match[2];
                if (!localizationKeys.has(key)) {
                    localizationKeys.set(key, []);
                }
                localizationKeys.get(key)?.push(value);
            }
        })
    );

    return localizationKeys;
}

async function findKeyUsagesForMultipleKeys(keys: string[], searchString: string): Promise<void> {
    const occurrences: { label: string; fullPath: string; line: number; character: number }[] = [];
    const files = await vscode.workspace.findFiles("**/*.dart");

    const regexMap = new Map<string, RegExp>();
    for (const key of keys) {
        regexMap.set(key, new RegExp(`\\.${key}\\b`, "g"));
    }

    await Promise.all(
        files.map(async file => {
            const textBytes = await vscode.workspace.fs.readFile(file);
            const text = new TextDecoder("utf-8").decode(textBytes);
            const lines = text.split("\n");

            for (const [key, regex] of regexMap) {
                for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
                    let match;
                    while ((match = regex.exec(lines[lineNumber])) !== null) {
                        occurrences.push({
                            label: `${vscode.workspace.asRelativePath(file)}:${lineNumber + 1} (${key})`,
                            fullPath: file.fsPath,
                            line: lineNumber,
                            character: match.index,
                        });
                    }
                }
            }
        })
    );

    if (occurrences.length === 0) {
        vscode.window.showInformationMessage(`No occurrences found.`);
    } else {
        const selected = await vscode.window.showQuickPick(
            occurrences.map(occ => occ.label),
            { placeHolder: `Found ${occurrences.length} occurrences for ${searchString}` }
        );

        if (selected) {
            const selectedOccurrence = occurrences.find(occ => occ.label === selected);
            if (selectedOccurrence) {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(selectedOccurrence.fullPath));
                const editor = await vscode.window.showTextDocument(doc);

                const position = new vscode.Position(selectedOccurrence.line, selectedOccurrence.character);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            }
        }
    }
}

