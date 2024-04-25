import {type Storage as ns} from "webextension-polyfill";

export interface StorageSchema {
    [K: string]: any
}
export type SchemaKey<Schema extends StorageSchema> = keyof Schema & string;
export type SchemaValue<Schema extends StorageSchema, Key extends SchemaKey<Schema>> = Schema[Key];

export interface StorageInterface<Schema extends StorageSchema> {
    get<K extends SchemaKey<Schema>>(key: K): Promise<Schema[K]|undefined>;
    getObject<T extends Partial<Schema>>(object: T): Promise<T>;

    set<K extends SchemaKey<Schema>>(key: K, value: SchemaValue<Schema, K>): Promise<void>;
    setObject(object: Partial<Schema>): Promise<void>;

    remove<K extends SchemaKey<Schema>>(...keys: K[]): Promise<void>;
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

    async get<K extends SchemaKey<Schema>, V = Schema[K]>(key: K): Promise<V | undefined> {
        let response = await this.storageArea.get(key);
        return response[key] ?? undefined;
    }

    getObject<T extends Partial<Schema>>(object: T): Promise<T> {
        return this.storageArea.get(object) as Promise<T>;
    }

    set<K extends SchemaKey<Schema>>(key: K, value: SchemaValue<Schema, K>): Promise<void> {
        return this.storageArea.set({[key]: value});
    }

    setObject(object: Partial<Schema>): Promise<void> {
        return this.storageArea.set(object);
    }

    remove<K extends SchemaKey<Schema>>(...keys: K[]): Promise<void> {
        return this.storageArea.remove(keys);
    }
}
