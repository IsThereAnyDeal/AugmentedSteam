
interface PriceOverview {
    currency: string,
    initial: number,
    initial_formatted: string,
    final: number,
    discount_percent: number,
    individual?: number
}

export interface TPackageDetail {
    name: string,
    page_content: string,
    page_image: string,
    header_image: string,
    small_logo: string,
    apps: Array<{
        id: number,
        name: string
    }>,
    price: PriceOverview,
    platforms: {
        windows: boolean,
        mac: boolean,
        linux: boolean,
    },
    controller: {
        full_gamepad: boolean
    },
    release_date: {
        coming_soon: boolean,
        date: string
    }
}

export type TAppDetail = {
    // NOTE incomplete, only data we use are typed
    name: string,
    fullgame?: {
        appid: number,
        name: string
    },
    price_overview: PriceOverview,
    support_info: {
        email: string,
        url: string
    }
};

export interface TWishlistGame {
    appid: number,
    priority: number,
    added: number,
    price_overview?: {
        discount_percent: number
        final: number,
        currency: string
    }
}

export interface TDynamicStoreStatusResponse {
    ignored: string[],
    ignoredOwned: string[],
    owned: string[],
    wishlisted: string[],
}
