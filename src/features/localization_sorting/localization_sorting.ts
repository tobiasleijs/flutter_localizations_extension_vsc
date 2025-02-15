import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { preQueryCheck, formatLocalizationFile } from "../localization_generation/localization_generation";

export const localizationSorterProvider = vscode.commands.registerCommand("flutter_localizations.sortLocalizations", async () => {
    try {
        const result = preQueryCheck();
        sortLocalizations(result.languages);

    } catch (error) {
        vscode.window.showErrorMessage((error as Error).message);
    }

});


export function sortLocalizations(languages: string[]) {
    const rootFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const localizationsFolder = path.join(rootFolder, "lib/src/localization");

    for (const language of languages) {
        const localizationMap: { [key: string]: string } = JSON.parse(fs.readFileSync(path.join(localizationsFolder, language), "utf-8"));
        const sectionsMap = new Map<string, Map<string, string>>();
        let currentSection = "";

        for (const key in localizationMap) {
            const value = localizationMap[key];
            if (key.startsWith("@_")) {
                currentSection = key;
                sectionsMap.set(currentSection, new Map<string, string>());
            } else {
                sectionsMap.get(currentSection)?.set(key, value);
            }
        }

        const sortedSectionsMap = new Map([...sectionsMap.entries()].sort());
        for (const section of sortedSectionsMap) {
            const sortedSection = new Map([...section[1].entries()].sort());
            sortedSectionsMap.set(section[0], sortedSection);
        }

        const sortedLocalizationMap: { [key: string]: any } = {};
        for (const [sectionKey, sectionMap] of sortedSectionsMap) {
            sortedLocalizationMap[sectionKey] = {};
            
            for (const [key, value] of sectionMap) {
                sortedLocalizationMap[key] = value;
            }
        }

        const localizationFile = JSON.stringify(sortedLocalizationMap, null, 2);
        const sortedLocalizationFile = formatLocalizationFile(localizationFile);

        fs.writeFileSync(path.join(localizationsFolder, language), sortedLocalizationFile);
    }
}
