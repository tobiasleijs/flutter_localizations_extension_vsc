"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.localizationFinder = void 0;
const vscode = __importStar(require("vscode"));
exports.localizationFinder = vscode.commands.registerCommand("flutterLocalizationSearch.findLocalization", async () => {
    const searchString = await vscode.window.showInputBox({
        prompt: "Enter the localized string or key to search for",
    });
    if (!searchString) {
        return;
    }
    const lowerCaseSearchString = searchString.toLowerCase();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace open.");
        return;
    }
    const localizationKeys = new Map();
    await findLocalizationKeys(localizationKeys);
    let matchedKeys = [...localizationKeys.entries()].filter(([key, values]) => key.toLowerCase().includes(lowerCaseSearchString) ||
        values.some(value => value.toLowerCase().includes(lowerCaseSearchString)));
    if (matchedKeys.length === 0) {
        vscode.window.showInformationMessage("No matching localization key found.");
        return;
    }
    await findKeyUsagesForMultipleKeys(matchedKeys.map(([key]) => key), searchString);
});
async function findLocalizationKeys(localizationKeys) {
    const files = await vscode.workspace.findFiles("**/lib/src/localization/*.arb");
    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const matches = text.matchAll(/"(.*?)"\s*:\s*"(.*?)"/gi);
        for (const match of matches) {
            const key = match[1];
            const value = match[2];
            if (!localizationKeys.has(key)) {
                localizationKeys.set(key, []);
            }
            localizationKeys.get(key)?.push(value);
        }
    }
}
async function findKeyUsagesForMultipleKeys(keys, searchString) {
    const occurrences = [];
    const files = await vscode.workspace.findFiles("**/*.dart");
    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const lines = text.split("\n");
        for (const key of keys) {
            const regex = new RegExp(`\\.${key}`, "g");
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
    }
    if (occurrences.length === 0) {
        vscode.window.showInformationMessage(`No occurrences found.`);
    }
    else {
        const selected = await vscode.window.showQuickPick(occurrences.map(occ => occ.label), { placeHolder: `Found ${occurrences.length} occurrences for ${searchString}` });
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
//# sourceMappingURL=search_localizations.js.map