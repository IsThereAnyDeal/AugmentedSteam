import {SvelteMap, SvelteSet} from "svelte/reactivity";
import type Price from "@Content/Modules/Currency/Price";

export let allDlcs: SvelteSet<number> = new SvelteSet<number>();
export let ownedDlcs: SvelteSet<number> = new SvelteSet<number>();
export let wishlistedDlcs: SvelteSet<number> = new SvelteSet<number>();
export let selectedDlcs: SvelteSet<number> = new SvelteSet<number>();
export let dlcPriceMap: SvelteMap<number, Price> = new SvelteMap<number, Price>();