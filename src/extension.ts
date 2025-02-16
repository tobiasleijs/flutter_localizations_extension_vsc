import * as vscode from 'vscode';
import { localizationGenerationProvider } from './features/localization_generation/localization_generation';
import { localizationSorterProvider } from './features/localization_sorting/localization_sorting';
import { localizationFinder } from './features/localization_search/search_localizations';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(localizationGenerationProvider);
	context.subscriptions.push(localizationSorterProvider);
	context.subscriptions.push(localizationFinder);
}

export function deactivate() { }
