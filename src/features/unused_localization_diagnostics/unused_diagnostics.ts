import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

const diagnosticCollection = vscode.languages.createDiagnosticCollection("unusedLocalizationKeys");

export async function unusedLocalizationDiagnostics() {

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    diagnosticCollection.clear();

    const localizationKeys = await findLocalizationKeys();

    const usedKeysByScope = await findUsedLocalizationKeys(localizationKeys);

    const diagnostics: { [filePath: string]: vscode.Diagnostic[] } = {};

    for (const [key, locations] of localizationKeys.entries()) {
        for (const { filePath, line, startIndex } of locations) {
            const scopeFolder = path.dirname(filePath);
            const usedKeys = usedKeysByScope.get(scopeFolder) || new Set();

            if (!usedKeys.has(key)) {
                if (!diagnostics[filePath]) {
                    diagnostics[filePath] = [];
                }

                const range = new vscode.Range(line, startIndex, line, startIndex + key.length);
                diagnostics[filePath].push(
                    new vscode.Diagnostic(
                        range,
                        `Localization key "${key}" is not used in this project.`,
                        vscode.DiagnosticSeverity.Warning
                    )
                );
            }
        }
    }

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

            try {
                const jsonContent = JSON.parse(text);
                Object.keys(jsonContent).forEach((key) => {
                    if (!key.startsWith("@")) {
                        if (!localizationKeys.has(key)) {
                            localizationKeys.set(key, []);
                        }

                        const keyLine = lines.findIndex((line) => line.includes(`"${key}"`));
                        const startIndex = lines[keyLine].indexOf(`"${key}"`) + 1;

                        localizationKeys.get(key)?.push({
                            filePath: file.fsPath,
                            line: keyLine,
                            startIndex: startIndex
                        });
                    }
                });
            } catch (error) {
                console.error(`Error parsing ${file.fsPath}:`, error);
            }
        })
    );

    return localizationKeys;
}


async function findUsedLocalizationKeys(
    localizationKeys: Map<string, { filePath: string; line: number; startIndex: number }[]>
): Promise<Map<string, Set<string>>> {

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return new Map();
    }

    let dartFiles: vscode.Uri[] = await vscode.workspace.findFiles("**/*.dart");

    const usedKeysByScope = new Map<string, Set<string>>();

    const keysByScope = new Map<string, Set<string>>();

    for (const [key, locations] of localizationKeys.entries()) {
        for (const { filePath } of locations) {
            const scope = path.dirname(filePath);
            if (!keysByScope.has(scope)) {
                keysByScope.set(scope, new Set());
            }
            keysByScope.get(scope)?.add(key);
        }
    }

    await Promise.all(
        [...keysByScope.entries()].map(async ([scopeFolder, keys]) => {
            const scopePaths = findLocalizationScope(scopeFolder);

            const filteredDartFiles = scopePaths.length > 0
                ? dartFiles.filter(file => scopePaths.some(scope => file.fsPath.includes(scope)))
                : dartFiles;

            if (filteredDartFiles.length === 0) {
                return;
            }

            const regexMap = new Map<string, RegExp>();
            keys.forEach(key => regexMap.set(key, new RegExp(`\\.${key}\\b`, "g")));

            const usedKeys = new Set<string>();

            await Promise.all(
                filteredDartFiles.map(async file => {
                    const textBytes = await vscode.workspace.fs.readFile(file);
                    const text = new TextDecoder("utf-8").decode(textBytes);

                    for (const [key, regex] of regexMap) {
                        if (regex.test(text)) {
                            usedKeys.add(key);
                        }
                    }
                })
            );

            usedKeysByScope.set(scopeFolder, usedKeys);
        })
    );

    return usedKeysByScope;
}

function findLocalizationScope(arbFolder: string): string[] {
    const configPath = path.join(arbFolder, "config.yml");
    if (!fs.existsSync(configPath)) {
        return [];
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    const parsedConfig = yaml.parse(configContent);

    if (!parsedConfig || !parsedConfig.scope || !Array.isArray(parsedConfig.scope)) {
        return [];
    }

    return parsedConfig.scope;
}
