export function capitalizeFirstChar(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function decapitalizeFirstChar(str: string) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}