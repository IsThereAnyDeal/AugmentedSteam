
class StringUtils {

    // https://stackoverflow.com/a/6969486/7162651
    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }

    static clearSpecialSymbols(str) {
        return str.replace(/[\u00AE\u00A9\u2122]/g, "");
    }
}

export {StringUtils};
