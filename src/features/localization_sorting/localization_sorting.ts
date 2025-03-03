import * as vscode from "vscode";
import * as fs from "fs";
import { formatLocalizationFile } from "../localization_generation/localization_generation";

export const localizationSorterProvider = vscode.commands.registerCommand("flutter_localizations.sortLocalizations", async () => {
    try {
        sortLocalizations();

    } catch (error) {
        vscode.window.showErrorMessage((error as Error).message);
    }

});


export async function sortLocalizations() {
    const files = await vscode.workspace.findFiles("**/*.arb");

    for (const file of files) {
        console.log(`Sorting: ${file.fsPath}`);

        const localizationMap: { [key: string]: any } = JSON.parse(fs.readFileSync(file.fsPath, "utf-8"));

        const sections: Map<string, Map<string, string>> = new Map();
        const metadataEntries: Map<string, any> = new Map();
        let currentSection = "";

        for (const [key, value] of Object.entries(localizationMap)) {
            if (key.startsWith("@_")) {
                currentSection = key;
                sections.set(currentSection, new Map());
            } else if (key.startsWith("@")) {
                metadataEntries.set(key.substring(1), { metaKey: key, metaValue: value });
            } else {
                if (!sections.has(currentSection)) {
                    sections.set(currentSection, new Map());
                }
                sections.get(currentSection)?.set(key, value);
            }
        }

        const sortedSections = new Map([...sections.entries()].sort());

        sortedSections.forEach((sectionMap, sectionKey) => {
            sortedSections.set(sectionKey, new Map([...sectionMap.entries()].sort()));
        });

        const sortedLocalizationMap: { [key: string]: any } = {};
        for (const [sectionKey, sectionMap] of sortedSections) {
            sortedLocalizationMap[sectionKey] = {};
            for (const [key, value] of sectionMap) {
                sortedLocalizationMap[key] = value;

                if (metadataEntries.has(key)) {
                    const { metaKey, metaValue } = metadataEntries.get(key)!;
                    sortedLocalizationMap[metaKey] = metaValue;
                }
            }
        }

        const localizationFile = JSON.stringify(sortedLocalizationMap, null, 2);
        const sortedLocalizationFile = formatLocalizationFile(localizationFile);

        fs.writeFileSync(file.fsPath, sortedLocalizationFile);
    }
}
