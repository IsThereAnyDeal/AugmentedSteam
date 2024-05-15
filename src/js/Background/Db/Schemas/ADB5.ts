import type {DBSchema, StoreNames} from "idb";

export interface ADB5 extends DBSchema {
    coupons: {
        key: number,
        value: {
            appids: number[],
            image_url: string,
            title: string,
            discount: any,
            id: any,
            discount_note?: string,
            discount_note_id?: any,
            discount_doesnt_stack?: true,
            valid_id?: any,
            valid?: any
        },
        indexes: {
            "idx_appid": number
        }
    },
    giftsAndPasses: {
        key: "gifts"|"passes",
        value: number[],
        indexes: {
            "idx_appid": number
        }
    },
    items: {
        key: string,
        value: string
    },
    earlyAccessAppids: {
        key: number,
        value: number
    },
    purchases: {
        key: string,
        value: string
    },
    dynamicStore: {
        key: string,
        value: number[],
        indexes: {
            idx_appid: number
        }
    },
    packages: {
        key: number,
        value: {
            appids: number[],
            expiry: number
        },
        indexes: {
            idx_expiry: number
        }
    },
    storePageData: {
        key: number,
        value: {
            data: any,
            expiry: number
        },
        indexes: {
            idx_expiry: number
        }
    },
    profiles: {
        key: string,
        value: {
            data: any,
            expiry: number
        },
        indexes: {
            idx_expiry: number
        }
    },
    rates: {
        key: string,
        value: {
            data: {[from: string]: {[to: string]: number}},
            expiry: number
        },
        indexes: {
            idx_expiry: number
        }
    },
    notes: {
        key: number,
        value: string
    },
    collection: {
        key: string,
        value: string
    },
    waitlist: {
        key: string,
        value: string
    },
    itadImport: {
        key: string,
        value: number[],
    },
    workshopFileSizes: {
        key: number,
        value: {
            size: number,
            expiry: number
        },
        indexes: {
            idx_expiry: number
        }
    },
    reviews: {
        key: string,
        value: {
            data: Array<{
                default: number,
                rating: number,
                helpful: number,
                funny: number,
                length: number,
                visibility: number,
                playtime: number,
                awards: number,
                node: string,
                id: string
            }>,
            expiry: number
        },
        indexes: {
            idx_expiry: number
        }
    },
    storeList: {
        key: number,
        value: {
            id: number,
            title: string
        }
    },
    expiries: {
        key: StoreNames<ADB5>,
        value: number,
        indexes: {
            idx_expiry: number
        }
    }
}
