
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
    price: {
        currency: string,
        initial: number,
        final: number,
        discount_percent: number,
        individual: number
    },
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

export type TAppDetail = Record<string, any>; // TODO update type with actual data that we use

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

export type TFetchWishlistResponse = number|null

export interface TDynamicStoreStatusResponse {
    ignored: string[],
    ignoredOwned: string[],
    owned: string[],
    wishlisted: string[],
}
