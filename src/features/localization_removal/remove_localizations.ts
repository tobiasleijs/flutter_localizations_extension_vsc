import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export const localizationRemovalProvider = vscode.commands.registerCommand("flutter_localizations.removeLocalization", async () => {
    try {
        const localizationName = await askForLocalizationName();
        const localizationFolders = await findLocalizationFolders(localizationName);

        if (localizationFolders.length === 0) {
            vscode.window.showInformationMessage(`Localization "${localizationName}" not found in any localization files.`);
            return;
        }

        let localizationFolder = localizationFolders[0];
        if (localizationFolders.length > 1) {
            localizationFolder = await askUserForLocalizationFolder(localizationFolders);
        }

        removeLocalizations(localizationFolder, localizationName);

    } catch (error) {
        vscode.window.showErrorMessage((error as Error).message);
    }
});

async function askForLocalizationName(): Promise<string> {
    const localizationName = await vscode.window.showInputBox({ prompt: "Enter the name of the localization to remove" });
    if (!localizationName) {
        throw new Error("Localization name is required");
    }
    return localizationName;
}

async function findLocalizationFolders(localizationName: string): Promise<string[]> {
    const arbFiles = await vscode.workspace.findFiles("**/*.arb");
    const folders = new Set<string>();

    for (const file of arbFiles) {
        const content = JSON.parse(fs.readFileSync(file.fsPath, "utf-8"));
        if (content.hasOwnProperty(localizationName)) {
            folders.add(path.dirname(file.fsPath));
        }
    }

    return [...folders];
}

async function askUserForLocalizationFolder(localizationFolders: string[]) {
    const relativeFolders = localizationFolders.map(folder => path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "", folder));
    const localizationFolder = await vscode.window.showQuickPick(relativeFolders, { placeHolder: "The localization is found in multiple folders, pick one to remove it from" });
    if (!localizationFolder) {
        throw new Error("Localization folder is required");
    }
    return path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "", localizationFolder);
}

export async function removeUnusedLocalizationKey(uri: vscode.Uri, key: string) {
    const dir = path.dirname(uri.fsPath);
    const arbFiles = fs.readdirSync(dir).filter(file => file.endsWith(".arb"));
    const linesRemoved: string[] = [];

    for (const file of arbFiles) {
        const filePath = path.join(dir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`"${key}"`)) {
                lines.splice(i, 1);
                linesRemoved.push(filePath);
                break;
            }
        }
        fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    }

    if (linesRemoved.length > 0) {
        vscode.window.showInformationMessage(`Removed unused localization "${key}" from ${linesRemoved.join(", ")}.`);
    }

}

export async function removeAllUnusedLocalizationKeys(uri: vscode.Uri, keys: string[]) {
    const dir = path.dirname(uri.fsPath);
    const arbFiles = fs.readdirSync(dir).filter(file => file.endsWith(".arb"));
    let amountRemoved = 0;

    for (const file of arbFiles) {
        const filePath = path.join(dir, file);
        const fileContent =
            fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n");
        for (let i = 0; i < lines.length; i++) {
            for (const key of keys) {
                if (lines[i].includes(`"${key}"`)) {
                    lines.splice(i, 1);
                    amountRemoved++;
                    break;
                }
            }
        }
        fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    }

    if (amountRemoved > 0) {
        vscode.window.showInformationMessage(`Removed ${amountRemoved} unused localizations from ${arbFiles.length} files.`);
    }

}

function removeLocalizations(localizationFolder: string, localizationName: string) {
    const files = fs.readdirSync(localizationFolder).filter(file => file.endsWith(".arb"));

    for (const file of files) {
        const filePath = path.join(localizationFolder, file);
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        if (content.hasOwnProperty(localizationName)) {
            delete content[localizationName];
            const jsonString = JSON.stringify(content, null, 2);
            fs.writeFileSync(filePath, jsonString, "utf-8");
        }
    }

    vscode.window.showInformationMessage(`Localization "${localizationName}" removed from all files in ${localizationFolder}`);
}
