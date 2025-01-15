export function isValidSymbolName(name: string | undefined): boolean {
    if (!name) {
        return false;
    }
    return /^[a-zA-Z]+\w*$/.test(name);
}
