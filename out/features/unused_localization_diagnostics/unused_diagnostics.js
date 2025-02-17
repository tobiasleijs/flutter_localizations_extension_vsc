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
exports.unusedLocalizationDiagnostics = unusedLocalizationDiagnostics;
const vscode = __importStar(require("vscode"));
const diagnosticCollection = vscode.languages.createDiagnosticCollection("unusedLocalizationKeys");
async function unusedLocalizationDiagnostics() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    const localizationKeys = await findLocalizationKeys();
    const usedKeys = new Set(await findUsedLocalizationKeys([...localizationKeys.keys()]));
    const diagnostics = {};
    for (const [key, locations] of localizationKeys.entries()) {
        if (!usedKeys.has(key)) {
            for (const { filePath, line, startIndex } of locations) {
                if (!diagnostics[filePath]) {
                    diagnostics[filePath] = [];
                }
                const range = new vscode.Range(line, startIndex, line, startIndex + key.length);
                diagnostics[filePath].push(new vscode.Diagnostic(range, `"Localization ${key} is not used in this project"`, vscode.DiagnosticSeverity.Warning));
            }
        }
    }
    diagnosticCollection.clear();
    for (const [filePath, diags] of Object.entries(diagnostics)) {
        diagnosticCollection.set(vscode.Uri.file(filePath), diags);
    }
}
async function findLocalizationKeys() {
    const files = await vscode.workspace.findFiles("**/*.arb");
    const localizationKeys = new Map();
    await Promise.all(files.map(async (file) => {
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
    }));
    return localizationKeys;
}
async function findUsedLocalizationKeys(keys) {
    const usedKeys = new Set();
    const files = await vscode.workspace.findFiles("**/*.dart");
    const regexMap = new Map();
    keys.forEach(key => regexMap.set(key, new RegExp(`\\.${key}\\b`, "g")));
    await Promise.all(files.map(async (file) => {
        const textBytes = await vscode.workspace.fs.readFile(file);
        const text = new TextDecoder("utf-8").decode(textBytes);
        for (const [key, regex] of regexMap) {
            if (regex.test(text)) {
                usedKeys.add(key);
            }
        }
    }));
    return [...usedKeys];
}
//# sourceMappingURL=unused_diagnostics.js.map