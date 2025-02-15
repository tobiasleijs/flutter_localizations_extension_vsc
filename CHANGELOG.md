# Changelog

All notable changes to the "flutter-localizations" extension will be documented in this file.

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