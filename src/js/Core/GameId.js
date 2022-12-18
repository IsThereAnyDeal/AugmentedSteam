class GameId {

    static parseId(id) {
        if (!id) { return null; }

        const intId = parseInt(id);
        if (!intId) { return null; }

        return intId;
    }

    static getAppid(text) {
        let _text = text;

        if (!_text) { return null; }

        if (_text instanceof HTMLElement) {
            const appid = _text.dataset.dsAppid;
            if (appid) { return GameId.parseId(appid); }
            _text = _text.href;
            if (!_text) { return null; }
        }

        // app, games (legacy official group page), market/listing
        const m = _text.match(/(?:store\.steampowered|steamcommunity)\.com\/(?:app|games|market\/listings)\/(\d+)\/?/);
        return m && GameId.parseId(m[1]);
    }

    static getSubid(text) {
        let _text = text;

        if (!_text) { return null; }

        if (_text instanceof HTMLElement) {
            const subid = _text.dataset.dsPackageid;
            if (subid) { return GameId.parseId(subid); }
            _text = _text.href;
            if (!_text) { return null; }
        }

        const m = _text.match(/(?:store\.steampowered|steamcommunity)\.com\/sub\/(\d+)\/?/);
        return m && GameId.parseId(m[1]);
    }

    static getBundleid(text) {
        let _text = text;

        if (!_text) { return null; }

        if (_text instanceof HTMLElement) {
            const bundleid = _text.dataset.dsBundleid;
            if (bundleid) { return GameId.parseId(bundleid); }
            _text = _text.href;
            if (!_text) { return null; }
        }

        const m = _text.match(/(?:store\.steampowered|steamcommunity)\.com\/bundle\/(\d+)\/?/);
        return m && GameId.parseId(m[1]);
    }

    static trimStoreId(storeId) {
        return Number(storeId.slice(storeId.indexOf("/") + 1));
    }

    static getAppidImgSrc(text) {
        let _text = text;

        if (!_text) { return null; }

        if (_text instanceof HTMLImageElement) {
            if (_text.hasAttribute("src")) {
                _text = _text.getAttribute("src");
            } else {
                _text = _text.dataset.imageUrl;
            }
            if (!_text) { return null; }
        }

        // TODO support Steam's CDN option
        const m = _text.match(/(?:cdn\.(?:akamai|cloudflare)\.steamstatic\.com\/steam|steamcdn-a\.akamaihd\.net\/steam|steamcommunity\/public\/images)\/apps\/(\d+)\//);
        return m && GameId.parseId(m[1]);
    }

    static getAppidUriQuery(text) {
        if (!text) { return null; }
        const m = text.match(/appid=(\d+)/);
        return m && GameId.parseId(m[1]);
    }

    static getAppids(text) {
        const regex = /(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/g;
        const res = [];
        let m;
        while ((m = regex.exec(text)) !== null) {
            const id = GameId.parseId(m[1]);
            if (id) {
                res.push(id);
            }
        }
        return res;
    }

    static getAppidFromId(text) {
        if (!text) { return null; }
        const m = text.match(/game_(\d+)/);
        return m && GameId.parseId(m[1]);
    }

    static getAppidFromGameCard(text) {
        if (!text) { return null; }
        const m = text.match(/\/gamecards\/(\d+)/);
        return m && GameId.parseId(m[1]);
    }
}

export {GameId};
