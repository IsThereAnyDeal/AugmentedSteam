
export default class StringUtils {

    // https://stackoverflow.com/a/6969486/7162651
    static escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }

    static clearSpecialSymbols(str: string): string {
        return str.replace(/[\u00AE\u00A9\u2122]/g, "");
    }

    // https://github.com/SteamDatabase/SteamTracking/blob/6db3e47a120c5c938a0ab37186d39b02b14d27d9/steamcommunity.com/public/javascript/global.js#L2479
    static levenshtein(a: string, b: string): number {
        const alen = a.length;
        const blen = b.length;
        if (alen === 0) { return blen; }
        if (blen === 0) { return alen; }
        let tmp, i, j, prev, val, row, ma, mb, mc, md, bprev;

        if (alen > blen) {
            tmp = a;
            a = b;
            b = tmp;
        }

        row = new Int8Array(alen + 1);
        // init the row
        for (i = 0; i <= alen; i++) {
            row[i] = i;
        }

        // fill in the rest
        for (i = 1; i <= blen; i++) {
            prev = i;
            bprev = b[i - 1]
            for (j = 1; j <= alen; j++) {
                if (bprev === a[j - 1]) {
                    val = row[j - 1]!;
                } else {
                    ma = prev + 1;
                    mb = row[j]! + 1;
                    mc = ma - ((ma - mb) & ((mb - ma) >> 7));
                    md = row[j - 1]! + 1;
                    val = mc - ((mc - md) & ((md - mc) >> 7));
                }
                row[j - 1] = prev;
                prev = val;
            }
            row[alen] = prev;
        }
        return row[alen]!;
    }
}
