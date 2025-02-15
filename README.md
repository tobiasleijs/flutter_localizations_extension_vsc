# Flutter Localizations Extension

This Visual Studio Code extension helps you manage and generate localizations for your Flutter applications.

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