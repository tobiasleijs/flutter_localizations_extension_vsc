import * as vscode from 'vscode';
import { localizationGenerationProvider } from './features/localization_generation/localization_generation';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(localizationGenerationProvider);
}

export function deactivate() { }
