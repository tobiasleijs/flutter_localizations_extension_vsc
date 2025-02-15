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
exports.localizationGenerationProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const helpers_1 = require("../../util/helpers");
exports.localizationGenerationProvider = vscode.commands.registerCommand("flutter_localizations.createLocalization", async () => {
    try {
        const preQueryCheckResult = preQueryCheck();
        const queryResult = await queryUser(preQueryCheckResult.languages, preQueryCheckResult.localizationMap);
        addAndSaveLocalizations(preQueryCheckResult.localizationMap, preQueryCheckResult.localizationsFolder, queryResult.section, queryResult.translations, queryResult.localizationName, queryResult.isNewSection);
        generateFlutterLocalizations();
    }
    catch (error) {
        vscode.window.showErrorMessage(error.message);
    }
});
function preQueryCheck() {
    const rootFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootFolder) {
        throw new Error("Workspace folder not found");
    }
    const localizationsFolder = path.join(rootFolder, "lib/src/localization");
    const languages = getLanguages(localizationsFolder);
    if (languages.length === 0) {
        throw new Error("No languages found in the localization folder");
    }
    const localizationMap = JSON.parse(fs.readFileSync(path.join(localizationsFolder, languages[0]), "utf-8"));
    if (!localizationMap) {
        throw new Error("Couldn't read the localization file because it's not formatted correctly");
    }
    return { localizationsFolder, languages, localizationMap };
}
async function queryUser(languages, localizationMap) {
    const localizationName = await askForLocalizationName(localizationMap);
    const sectionResult = await askForSection(localizationMap);
    const section = sectionResult.section;
    const isNewSection = sectionResult.isNewSection;
    const translations = await askForTranslations(languages);
    return { localizationName, section, isNewSection, translations };
}
async function askForLocalizationName(localizationMap) {
    let localizationName = await vscode.window.showInputBox({ prompt: "Enter the name of the localization" });
    if (!localizationName) {
        throw new Error("Localization name is required");
    }
    localizationName = (0, helpers_1.decapitalizeFirstChar)(localizationName.trim());
    if (!/^[a-zA-Z]+$/.test(localizationName)) {
        throw new Error("The localization name must contain only letters");
    }
    if (localizationAlreadyExists(localizationMap, localizationName)) {
        throw new Error("Localization already exists");
    }
    return localizationName;
}
async function askForSection(localizationMap) {
    const sections = getSections(localizationMap);
    let section = await vscode.window.showQuickPick(sections.map((section) => section.slice(2)), { placeHolder: "Which section do you want to add the localization to?" });
    if (!section) {
        throw new Error("Section is required");
    }
    const isNewSection = section === "Create new section...";
    if (isNewSection) {
        let newSection = await vscode.window.showInputBox({ prompt: "Enter the name of the new section" });
        if (!newSection) {
            throw new Error("Section name is required");
        }
        section = newSection.trim().toUpperCase();
    }
    if (!/^(\$_)?[A-Z_ ]+$/.test(section)) {
        throw new Error("The section name must contain only letters, underscores, or spaces");
    }
    section = section.replace(/\s+/g, "_");
    return { section, isNewSection };
}
async function askForTranslations(languages) {
    const translations = new Map();
    for (const language of languages) {
        const translation = await vscode.window.showInputBox({ prompt: `Enter the translation for ${language.replace(".arb", "")}` });
        if (!translation) {
            throw new Error("Translation is required");
        }
        translations.set(language, translation);
    }
    return translations;
}
function getSections(localizationMap) {
    const sections = [];
    for (const key in localizationMap) {
        if (key.startsWith("@_")) {
            sections.push(key);
        }
    }
    sections.sort();
    sections.push("$_Create new section...");
    return sections;
}
function getLanguages(localizationPath) {
    const files = fs.readdirSync(localizationPath);
    return files.filter((file) => file.endsWith(".arb"));
}
function addAndSaveLocalizations(localizationMap, localizationsFolder, section, translations, localizationName, isNewSection) {
    for (const [language, translation] of translations) {
        const entries = Object.entries(localizationMap);
        if (isNewSection) {
            entries.push([`@_${section}`, {}]);
        }
        const sectionIndex = entries.findIndex(([key]) => key === `@_${section}`);
        if (sectionIndex === -1) {
            vscode.window.showErrorMessage(`Section ${section} not found`);
            return;
        }
        entries.splice(sectionIndex + 1, 0, [localizationName, translation]);
        const updatedLocalizationMap = Object.fromEntries(entries);
        let jsonString = JSON.stringify(updatedLocalizationMap, null, 2);
        jsonString = formatLocalizationFile(jsonString);
        const localizationFilePath = path.join(localizationsFolder, language);
        fs.writeFileSync(localizationFilePath, jsonString, "utf-8");
    }
}
function formatLocalizationFile(file) {
    const splitValue = "\"@_";
    const splitFile = file.split(splitValue);
    if (splitFile.length < 2) {
        return file;
    }
    const firstSection = splitFile[0] + splitValue + splitFile[1];
    const remainingSections = splitFile.slice(2).map(section => "\n\n" + splitValue + section);
    const formattedFile = [firstSection, ...remainingSections].join('');
    return formattedFile;
}
function localizationAlreadyExists(localizationMap, localizationName) {
    return Object.keys(localizationMap).includes(localizationName);
}
function generateFlutterLocalizations() {
    const task = new vscode.Task({ type: 'shell' }, vscode.TaskScope.Workspace, 'Flutter Gen L10n', 'flutter', new vscode.ShellExecution('flutter gen-l10n'));
    vscode.tasks.executeTask(task);
}
//# sourceMappingURL=localization_generation.js.map