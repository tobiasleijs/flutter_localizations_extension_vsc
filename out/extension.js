"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const localization_generation_1 = require("./features/localization_generation/localization_generation");
const localization_sorting_1 = require("./features/localization_sorting/localization_sorting");
function activate(context) {
    context.subscriptions.push(localization_generation_1.localizationGenerationProvider);
    context.subscriptions.push(localization_sorting_1.localizationSorterProvider);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map