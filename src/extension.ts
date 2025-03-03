import * as vscode from 'vscode';
import { localizationGenerationProvider } from './features/localization_generation/localization_generation';
import { localizationSorterProvider } from './features/localization_sorting/localization_sorting';
import { localizationFinder } from './features/localization_search/search_localizations';
import { unusedLocalizationDiagnostics } from "./features/unused_localization_diagnostics/unused_diagnostics";
import { localizationRemovalProvider, removeUnusedLocalizationKey, removeAllUnusedLocalizationKeys } from './features/localization_removal/remove_localizations';
import { UnusedLocalizationCodeActionProvider } from './features/unused_localization_diagnostics/unused_code_action';

let diagnosticDebounceTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(localizationGenerationProvider);
	context.subscriptions.push(localizationSorterProvider);
	context.subscriptions.push(localizationFinder);
	context.subscriptions.push(localizationRemovalProvider);

	vscode.workspace.textDocuments.forEach((document) => {
		if (document.fileName.endsWith(".arb")) {
			unusedLocalizationDiagnostics();
		}
	});

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument((document) => {
			if (document.fileName.endsWith(".arb")) {
				unusedLocalizationDiagnostics();
			}
		})
	);

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

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{ scheme: "file", pattern: "**/*.arb" },
			new UnusedLocalizationCodeActionProvider(),
			{ providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"extension.removeUnusedLocalizationKey",
			removeUnusedLocalizationKey
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"extension.removeAllUnusedLocalizationKeys",
			removeAllUnusedLocalizationKeys
		)
	);



	unusedLocalizationDiagnostics();
}

export function deactivate() { }
