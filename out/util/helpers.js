"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalizeFirstChar = capitalizeFirstChar;
exports.decapitalizeFirstChar = decapitalizeFirstChar;
function capitalizeFirstChar(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function decapitalizeFirstChar(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
//# sourceMappingURL=helpers.js.map