"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const localization_generation_1 = require("./features/localization_generation/localization_generation");
function activate(context) {
    context.subscriptions.push(localization_generation_1.localizationGenerationProvider);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map