# Flutter Localizations Extension

This Visual Studio Code extension helps you manage and generate localizations for your Flutter applications.

## How to install
1. Run `npm install`  to install all libraries in the project.
1. Install the package vsce, for macos users this means running the command `brew install vsce`.
1. In the root of the folder run the command `vsce package`, enter 'y' for all the prompts.
1. Go to the Extensions view.
1. Select the three vertical dots icon in the upper right corner.
1. Select Install from VSIX...
1. Select the extension that you packaged in step 3, which should be in the root of your repository.



## Features

### Localization Generation

The extension provides a command to create and manage localizations in your Flutter project. It allows you to add new localization entries to existing sections or create new sections in your localization files.

#### How to Use

1. Open the command palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).
2. Run the command `Iconica: Add Flutter Localization`.
3. Follow the prompts to:
   - Enter the name of the localization.
   - Select the section to add the localization to or create a new section.
   - Enter the translations for each language in your project.

The extension will automatically update your localization files and run the `flutter gen-l10n` command to generate the necessary localization files for your Flutter project.

### Localization Sorting

The extension provides a command to sort localizations in your Flutter project. It sorts the localization entries within each section alphabetically and ensures that sections are also sorted alphabetically.

#### How to Use

1. Open the command palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).
2. Run the command `Flutter Localizations: Sort Flutter Localizations`.

The extension will automatically sort your localization files and format them accordingly.

### Localization Search

The extension provides a command to search for localization keys and values in your Flutter project. It allows you to find all instances of a localization key or value in your Dart files.

#### How to Use

1. Open the command palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).
2. Run the command `Iconica: Find Flutter Localization`.
3. Enter the localized string or key to search for.

The extension will search for the specified key or value in your localization files and Dart files, and display the results.


### Unused Localization Diagnostics & Code Actions

The extension automatically diagnoses and highlights unused localization keys in your Flutter project. It helps you identify and clean up localization keys that are no longer used in your codebase.

When activating the code actions for a diagnostic, there will be two options. The first option will remove the selected localization, the second option will remove all unused localizations from the file.

#### How It Works

The extension continuously analyzes your localization files and Dart files to detect unused localization keys. If any unused keys are found, they will be highlighted in the editor with a warning message indicating that the localization key is not used in the project.
