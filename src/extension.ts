import * as vscode from 'vscode';
import { localizationGenerationProvider } from './features/localization_generation/localization_generation';
import { localizationSorterProvider } from './features/localization_sorting/localization_sorting';
import { localizationFinder } from './features/localization_search/search_localizations';
import { unusedLocalizationDiagnostics } from "./features/unused_localization_diagnostics/unused_diagnostics";


let diagnosticDebounceTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(localizationGenerationProvider);
	context.subscriptions.push(localizationSorterProvider);
	context.subscriptions.push(localizationFinder);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => {
			const document = event.document;
			if (document.fileName.endsWith(".arb")) {
				if (diagnosticDebounceTimer) {
					clearTimeout(diagnosticDebounceTimer);
				}
				diagnosticDebounceTimer = setTimeout(() => {
					unusedLocalizationDiagnostics();
				}, 5000);
			}
		})
	);

	unusedLocalizationDiagnostics();
}

export function deactivate() { }
