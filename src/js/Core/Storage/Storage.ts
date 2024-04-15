import {type Storage as ns} from "webextension-polyfill";

interface StorageInterface {
    get<K extends string, V>(key: K): Promise<V|undefined>;
    getObject<T extends Record<string, any>>(object: T): Promise<T>;
    getAll<V extends Record<string, any>>(): Promise<Partial<V>>;

    set<K extends string, V>(key: K, value: V): Promise<void>;
    setObject<T extends Record<string, any>>(object: T): Promise<void>;

    remove<K extends string>(...keys: K[]): Promise<void>;
}

export default class Storage<T extends ns.SyncStorageAreaSync|ns.LocalStorageArea>
    implements StorageInterface {

    private storageArea: T;

    constructor(storageArea: T) {
        this.storageArea = storageArea;
    }

    get onChanged() {
        return this.storageArea.onChanged;
    }

    async get<K extends string, V>(key: K): Promise<V | undefined> {
        let response = await this.storageArea.get(key);
        return response[key] ?? undefined;
    }

    getAll<V extends Record<string, any>>(): Promise<Partial<V>> {
        return this.storageArea.get(null) as Promise<Partial<V>>;
    }

    getObject<T extends Record<string, any>>(object: T): Promise<T> {
        return this.storageArea.get(object) as Promise<T>;
    }

    set<K extends string, V>(key: K, value: V): Promise<void> {
        return this.storageArea.set({[key]: value});
    }

    setObject<T extends Record<string, any>>(object: T): Promise<void> {
        return this.storageArea.set(object);
    }

    remove<K extends string>(...keys: K[]): Promise<void> {
        return this.storageArea.remove(keys);
    }
}
