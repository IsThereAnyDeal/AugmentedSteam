import {SvelteMap} from "svelte/reactivity";
import {untrack} from "svelte";

export default class FilterState {

    readonly #state: SvelteMap<string, string> = new SvelteMap<string, string>();

    onUpdate: (() => void)|undefined;

    constructor() {
        $effect.root(() => {
            $effect(() => {
                this.#state;
                untrack(() => {
                    this.#buildUrl();
                });
            });
        });
    }

    getBoolean(key: string): boolean {
        return (this.#state.get(key) ?? false) === "1";
    }

    setBoolean(key: string, value: boolean): void {
        if (!value) {
            this.#state.delete(key);
        } else {
            this.#state.set(key, "1");
        }

        this.#buildUrl();
        this.onUpdate?.();
    }

    getRange(key: string): [number|null, number|null] {
        const value = this.#state.get(key) ?? "";

        const m = value.match(/^(\d+|_)-(\d+|_)$/);
        if (m) {
            const min = m[1] === "_" ? null : Number(m[1]);
            const max = m[2] === "_" ? null : Number(m[2]);
            return [min, max];
        }
        return [null, null];
    }

    setRange(key: string, min: number|null, max: number|null): void {
        if (min === null && max === null) {
            this.#state.delete(key);
        } else {
            this.#state.set(key, (min ?? "_") + "-" + (max ?? "_"));
        }

        this.#buildUrl();
        this.onUpdate?.();
    }

    parseUrl(): void {
        const url = new URL(window.location.href);
        const params = url.searchParams.get("as-filters");
        if (!params) {
            return;
        }

        const parts = params.split(";");

        this.#state.clear();
        for (const part of parts) {
            const [key, value] = part.split(":");
            if (key && value) {
                this.#state.set(key, value);
            }
        }
    }

    #buildUrl(): void {
        let parts: string[] = [];
        for (const [key, value] of this.#state.entries()) {
            parts.push(`${key}:${value}`);
        }

        const url = new URL(window.location.href);
        if (parts.length === 0) {
            url.searchParams.delete("as-filters");
        } else {
            url.searchParams.set("as-filters", parts.join(";"))
        }

        window.history.pushState(null,"", url);
    }
}
