import type CapacityInfo from "@Content/Modules/UserNotes/CapacityInfo";

export default interface AdapterInterface {
    get(...appids: number[]): Promise<Map<number, string|null>>;
    set(appid: number, note: string): Promise<CapacityInfo|null>;
    delete(appid: number): Promise<void>;
    export(): Promise<Record<string, string>>;
    import(notes: Record<string, string>): Promise<void>;
    clear(): Promise<void>
}
