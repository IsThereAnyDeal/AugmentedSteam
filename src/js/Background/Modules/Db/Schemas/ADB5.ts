import type {DBSchema, StoreNames} from "idb";

export interface ADB5 extends DBSchema {
    coupons: {
        key: string,
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
            "appid": number[]
        }
    },
    /*
    giftsAndPasses: {
        indexes: {
            appid: number
        }
    },
    items: {},
    */
    earlyAccessAppids: {
        key: number,
        value: number
    },
    /*purchases: {},
    dynamicStore: {
        indexes: {
            appid: number
        }
    },
    packages: {},
    */
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
    /* notes: {},
    collection: {},
    waitlist: {},
    itadImport: {},

    // v2
    "workshopFileSizes": {},
    "reviews": {},

    // v4
    storeList: {},
*/
    // v5
    expiries: {
        key: StoreNames<ADB5>,
        value: number,
        indexes: {
            "": number
        }
    }
}
