# Changelog

All notable changes to the "flutter-localizations" extension will be documented in this file.

## [0.4.0] - 2025-02-16

### Added

- Automatically diagnose and highlight unused localization keys in your Flutter project.
- Continuously analyzes your localization files and Dart files.
- Highlights any unused localization keys with a warning message.


## [0.3.0] - 2025-02-16

### Added
- Added a new feature to search for localized strings or keys within the project. Use the command `Iconica: Find Flutter Localization` to initiate the search.

## [0.2.0] - 2025-02-15

### Added

- Added the `Flutter Localizations: Sort Flutter Localizations` command to sort localization entries within each section alphabetically and ensure that sections are also sorted alphabetically.


## [0.1.0] - 2025-02-15

### Added

- Initial release of the Flutter Localizations Extension.
- Added the `Flutter Localizations: Create Localization` command to create and manage localizations in your Flutter project.
  - Prompts the user to enter the name of the localization.
  - Allows the user to select an existing section or create a new section for the localization.
  - Prompts the user to enter translations for each language.
  - Automatically updates the localization files and runs the `flutter gen-l10n` command in the background.
- Added support for adding new localization entries to existing sections or creating new sections in the localization files.
- Ensures that two new lines are added before every section except the first one when saving the localization files.
- Automatically runs the `flutter gen-l10n` command in the background after updating the localization files to keep the Flutter project up-to-date with the latest localizations.