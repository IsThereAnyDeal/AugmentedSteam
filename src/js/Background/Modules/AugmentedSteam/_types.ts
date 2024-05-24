
interface TShop {
    id: number,
    name: string,
}

export interface TPrice {
    amount: number,
    amountInt: number,
    currency: string
}

interface TDrm {
    id: number,
    name: string
}

interface TPlatform {
    id: number,
    name: string
}

interface TCurrent {
    shop: TShop,
    price: TPrice,
    regular: TPrice,
    cut: number,
    voucher: string|null,
    flag: "H"|"N"|"S"|null,
    drm: TDrm[],
    platforms: TPlatform[],
    timestamp: string,
    expiry: string|null,
    url: string
}

interface TLowest {
    shop: TShop,
    price: TPrice,
    regular: TPrice,
    cut: number,
    timestamp: string
}

export interface TPriceOverview {
    current: TCurrent|null,
    lowest: TLowest|null,
    bundled: number,
    urls: {
        info: string,
        history: string
    }
}

export interface TBundle {
    id: number,
    title: string,
    page: {
        id: number,
        name: string
    },
    url: string,
    details: string,
    isMature: boolean,
    publish: string,
    expiry: string|null,
    country: {
        games: number,
        media: number
    },
    tiers: TTier[]
}

interface TTier {
    price: TPrice|null,
    games: TBundleGame[]
}

interface TBundleGame {
    id: string,
    slug: string,
    title: string,
    type: string|null,
    mature: boolean
}

export interface TProfileData {
    badges: Array<{
        title: string,
        img: string,
        link?: string
    }>,
    steamrep: Array<string>
    style: string|null
    bg: {
        img: string|null,
        appid: number|null
    }
}


export interface TFetchPricesResponse {
    prices: Record<string, TPriceOverview>,
    bundles: TBundle[]
}

export interface TStorePageData {
    family_sharing: boolean,
    players: {
        recent: number,
        peak_today: number,
        peak_all: number
    },
    wsgf: {
        "url": string,
        "wide": string,
        "ultrawide": string,
        "multi_monitor": string,
        "4k": string
    }|null,
    hltb: {
        story: number|null,
        extras: number|null,
        complete: number|null,
        url: string
    }|null,
    reviews: {
        metauser: {
            score: number|null,
            verdict: number|null,
            url: string
        }|null,
        opencritic: {
            score: number|null,
            verdict: string|null,
            url: string
        }|null
    }
}

export type TDlcInfo = Array<{
    id: number,
    name: string,
    description: string,
    icon: string
}>;

export interface TIsEarlyAccessResponse {
    [appid: number]: boolean
}

export type TSimilarResponse = Array<{
    title: string,
    appid: number,
    sprating: number,
    score: number
}>;

export interface TFetchRatesResponse {
    [from: string]: {
        [to: string]: number
    }
}

export type TFetchProfileBackgroundsResponse = Array<[string, string]>;

export type TFetchProfileBackgroundsGamesResponse = Array<[number, string]>;

export interface TFetchMarketCardPricesResponse {
    [title: string]: {
        img: string,
        url: string,
        price: number
    }
}

export interface TFetchMarketCardAveragePricesResponse {
    [id: string]: {
        regular: number,
        foil: number
    }
}

export interface TFetchTwitchStreamResponse {
    user_name: string,
    game: string,
    view_count: number,
    thumbnail_url: string
}
