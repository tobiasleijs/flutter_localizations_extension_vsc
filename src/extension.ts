import * as vscode from 'vscode';
import { localizationGenerationProvider } from './features/localization_generation/localization_generation';
import { localizationSorterProvider } from './features/localization_sorting/localization_sorting';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(localizationGenerationProvider);
	context.subscriptions.push(localizationSorterProvider);
}

export function deactivate() { }
