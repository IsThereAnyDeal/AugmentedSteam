import {type Storage as ns} from "webextension-polyfill";

/*
 * Type declarations stolen from idb, because I was too dumb to figure them out on my own
 * */
declare type KeyToKeyNoIndex<T> = {
    [K in keyof T]: string extends K ? never : number extends K ? never : K;
};
export declare type ValuesOf<T> = T extends {
    [K in keyof T]: infer U;
} ? U : never;
declare type KnownKeys<T> = ValuesOf<KeyToKeyNoIndex<T>>;

export declare type StorageSchema = Record<string, any>;
export declare type SchemaKeys<Schema extends StorageSchema | unknown> = Schema extends StorageSchema ? (KnownKeys<Schema> & string) : string;
export declare type SchemaValue<Schema extends StorageSchema | unknown, Key extends SchemaKeys<Schema>> = Schema extends StorageSchema ? Schema[Key] : any;

export interface StorageInterface<Schema extends StorageSchema> {
    get<K extends SchemaKeys<Schema>>(key: K): Promise<SchemaValue<Schema, K>|undefined>;
    getObject<T extends Partial<Schema>>(object: T): Promise<T>;

    set<K extends SchemaKeys<Schema>>(key: K, value: SchemaValue<Schema, K>): Promise<void>;
    setObject(object: Partial<Schema>): Promise<void>;

    remove<K extends SchemaKeys<Schema>>(...keys: K[]): Promise<void>;
}

export default class Storage<
    Area extends ns.SyncStorageAreaSync|ns.LocalStorageArea,
    Schema extends StorageSchema
> implements StorageInterface<Schema> {

    private storageArea: Area;

    constructor(storageArea: Area) {
        this.storageArea = storageArea;
    }

    get onChanged() {
        return this.storageArea.onChanged;
    }

    async get<K extends SchemaKeys<Schema>>(key: K): Promise<SchemaValue<Schema, K> | undefined> {
        let response = await this.storageArea.get(key);
        return response[key] ?? undefined;
    }

    getObject<T extends Partial<Schema>>(object: T): Promise<T> {
        return this.storageArea.get(object) as Promise<T>;
    }

    set<K extends SchemaKeys<Schema>>(key: K, value: SchemaValue<Schema, K>): Promise<void> {
        return this.storageArea.set({[key]: value});
    }

    setObject(object: Partial<Schema>): Promise<void> {
        return this.storageArea.set(object);
    }

    remove<K extends SchemaKeys<Schema>>(...keys: K[]): Promise<void> {
        return this.storageArea.remove(keys);
    }
}
