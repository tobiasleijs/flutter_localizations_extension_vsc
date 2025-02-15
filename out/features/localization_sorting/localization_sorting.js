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
exports.localizationSorterProvider = void 0;
exports.sortLocalizations = sortLocalizations;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const localization_generation_1 = require("../localization_generation/localization_generation");
exports.localizationSorterProvider = vscode.commands.registerCommand("flutter_localizations.sortLocalizations", async () => {
    try {
        const result = (0, localization_generation_1.preQueryCheck)();
        sortLocalizations(result.languages);
    }
    catch (error) {
        vscode.window.showErrorMessage(error.message);
    }
});
function sortLocalizations(languages) {
    const rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const localizationsFolder = path.join(rootFolder, "lib/src/localization");
    for (const language of languages) {
        const localizationMap = JSON.parse(fs.readFileSync(path.join(localizationsFolder, language), "utf-8"));
        const sectionsMap = new Map();
        let currentSection = "";
        for (const key in localizationMap) {
            const value = localizationMap[key];
            if (key.startsWith("@_")) {
                currentSection = key;
                sectionsMap.set(currentSection, new Map());
            }
            else {
                sectionsMap.get(currentSection)?.set(key, value);
            }
        }
        const sortedSectionsMap = new Map([...sectionsMap.entries()].sort());
        for (const section of sortedSectionsMap) {
            const sortedSection = new Map([...section[1].entries()].sort());
            sortedSectionsMap.set(section[0], sortedSection);
        }
        const sortedLocalizationMap = {};
        for (const [sectionKey, sectionMap] of sortedSectionsMap) {
            sortedLocalizationMap[sectionKey] = {};
            for (const [key, value] of sectionMap) {
                sortedLocalizationMap[key] = value;
            }
        }
        const localizationFile = JSON.stringify(sortedLocalizationMap, null, 2);
        const sortedLocalizationFile = (0, localization_generation_1.formatLocalizationFile)(localizationFile);
        fs.writeFileSync(path.join(localizationsFolder, language), sortedLocalizationFile);
    }
}
//# sourceMappingURL=localization_sorting.js.map