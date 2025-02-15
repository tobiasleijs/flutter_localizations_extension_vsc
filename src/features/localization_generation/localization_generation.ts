import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { decapitalizeFirstChar } from "../../util/helpers";

export const localizationGenerationProvider = vscode.commands.registerCommand("flutter_localizations.createLocalization", async () => {
    try {
        const preQueryCheckResult = preQueryCheck();

        const queryResult = await queryUser(
            preQueryCheckResult.languages,
            preQueryCheckResult.localizationMap,
        );

        addAndSaveLocalizations(
            preQueryCheckResult.localizationMap,
            preQueryCheckResult.localizationsFolder,
            queryResult.section,
            queryResult.translations,
            queryResult.localizationName,
            queryResult.isNewSection,
        );

        generateFlutterLocalizations();

    } catch (error) {
        vscode.window.showErrorMessage((error as Error).message);
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

    const localizationMap: Map<string, string> = JSON.parse(fs.readFileSync(path.join(localizationsFolder, languages[0]), "utf-8"));

    if (!localizationMap) {
        throw new Error("Couldn't read the localization file because it's not formatted correctly");
    }

    return { localizationsFolder, languages, localizationMap };
}

async function queryUser(languages: string[], localizationMap: Map<string, string>) {
    const localizationName = await askForLocalizationName(localizationMap);
    const sectionResult = await askForSection(localizationMap);
    const section = sectionResult.section;
    const isNewSection = sectionResult.isNewSection;
    const translations = await askForTranslations(languages);

    return { localizationName, section, isNewSection, translations };
}

async function askForLocalizationName(localizationMap: Map<string, string>) {
    let localizationName = await vscode.window.showInputBox({ prompt: "Enter the name of the localization" });
    if (!localizationName) {
        throw new Error("Localization name is required");
    }

    localizationName = decapitalizeFirstChar(localizationName.trim());

    if (!/^[a-zA-Z]+$/.test(localizationName)) {
        throw new Error("The localization name must contain only letters");
    }

    if (localizationAlreadyExists(localizationMap, localizationName)) {
        throw new Error("Localization already exists");
    }
    return localizationName;
}

async function askForSection(localizationMap: Map<string, string>) {
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

async function askForTranslations(languages: string[]) {
    const translations: Map<string, string> = new Map<string, string>();
    for (const language of languages) {
        const translation = await vscode.window.showInputBox({ prompt: `Enter the translation for ${language.replace(".arb", "")}` });
        if (!translation) {
            throw new Error("Translation is required");
        }
        translations.set(language, translation);
    }
    return translations;
}

function getSections(localizationMap: Map<string, string>): string[] {
    const sections: string[] = [];

    for (const key in localizationMap) {
        if (key.startsWith("@_")) {
            sections.push(key);
        }
    }

    sections.sort();

    sections.push("$_Create new section...");

    return sections;
}

function getLanguages(localizationPath: string): string[] {
    const files = fs.readdirSync(localizationPath);
    return files.filter((file) => file.endsWith(".arb"));
}


function addAndSaveLocalizations(
    localizationMap: { [key: string]: any },
    localizationsFolder: string, section: string,
    translations: Map<string, string>,
    localizationName: string,
    isNewSection: boolean,
) {
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

function formatLocalizationFile(file: string) {
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

function localizationAlreadyExists(localizationMap: { [key: string]: any }, localizationName: string) {
    return Object.keys(localizationMap).includes(localizationName);
}

function generateFlutterLocalizations() {
    const task = new vscode.Task(
        { type: 'shell' },
        vscode.TaskScope.Workspace,
        'Flutter Gen L10n',
        'flutter',
        new vscode.ShellExecution('flutter gen-l10n')
    );
    vscode.tasks.executeTask(task);
}