
class StringUtils {

    // https://stackoverflow.com/a/6969486/7162651
    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
}

export {StringUtils};
