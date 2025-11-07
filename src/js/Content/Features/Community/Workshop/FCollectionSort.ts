import self_ from "./FCollectionSort.svelte";
import type Context from "@Content/Modules/Context/Context";
import Feature from "@Content/Modules/Context/Feature";
import {type SortConfig, ESortCriteria} from "@Content/Features/Community/Workshop/CollectionSort/_types";
import { mount } from "svelte";

export default class FCollectionSort extends Feature<Context> {

    private originalOrder: HTMLElement[] = [];

    override checkPrerequisites(): boolean {
        return document.querySelector('.collectionItem') !== null;
    }

    override apply(): void {
        const collectionChildren = document.querySelector('.collectionChildren');
        if (!collectionChildren?.parentElement) { return; }

        if (collectionChildren) {
            this.originalOrder = Array.from(
                collectionChildren.querySelectorAll('.collectionItem')
            ) as HTMLElement[];
        }

        mount(self_, {
                    target: collectionChildren.parentElement,
                    anchor: collectionChildren,
                    props: {
                        handler: (config: SortConfig) => this._sort(config)
                    }
                });
    }

    private _sort(config: SortConfig): void {
        const collectionChildren = document.querySelector('.collectionChildren');
        if (!collectionChildren) { return; }

        let items: HTMLElement[];

        if (config.size === 0) {
            // restore original order
            items = this.originalOrder;
        } else {
            items = Array.from(collectionChildren.querySelectorAll<HTMLElement>('.collectionItem'));
            if (items.length === 0) { return; }

            const sortConfig = new Map(config.entries());

            // sort criteria in defined order
            let criteria = [
                ESortCriteria.Subscription,
                ESortCriteria.Rating,
                ESortCriteria.Title,
                ESortCriteria.Author,
            ].filter(c => sortConfig.has(c));

            // sort by title implicitly as last criterion if not set explicitly
            if (!sortConfig.has(ESortCriteria.Title)) {
                criteria.push(ESortCriteria.Title);
                sortConfig.set(ESortCriteria.Title, 1);
            }

            items.sort((a, b) => this._compareItems(a, b, criteria, sortConfig));
        }

        // Reorder DOM elements
        items.forEach(item => {
            collectionChildren.appendChild(item);
            const scriptTag = item.nextElementSibling;
            if (scriptTag && scriptTag.tagName === 'SCRIPT') {
                collectionChildren.appendChild(scriptTag);
            }
        });
    }

    private _compareItems(a: HTMLElement, b: HTMLElement, criteria: ESortCriteria[], config: SortConfig): number {
        for (const by of criteria) {
            const dir = config.get(by) ?? null;
            if (!dir) {
                continue;
            }

            let result = 0;
            switch (by) {
                case ESortCriteria.Subscription: result = this._compareSubscription(a, b); break;
                case ESortCriteria.Rating:       result = this._compareRating(a, b);       break;
                case ESortCriteria.Title:        result = this._compareTitle(a, b);        break;
                case ESortCriteria.Author:       result = this._compareAuthor(a, b);       break;
            }

            if (result !== 0) {
                return result * dir;
            }
        }
        return 0;
    }

    private _compareSubscription(a: HTMLElement, b: HTMLElement): number {
        const isSubscribedA = a.querySelector('.subscriptionControls .subscribe.toggled') !== null;
        const isSubscribedB = b.querySelector('.subscriptionControls .subscribe.toggled') !== null;

        if (isSubscribedA === isSubscribedB) { return 0; }
        return isSubscribedA ? 1 : -1;
    }

    private _compareRating(a: HTMLElement, b: HTMLElement): number {
        return this._getRating(a) - this._getRating(b);
    }

    private _compareTitle(a: HTMLElement, b: HTMLElement): number {
        return this._getTitle(a).localeCompare(this._getTitle(b));
    }

    private _compareAuthor(a: HTMLElement, b: HTMLElement): number {
        return this._getAuthor(a).localeCompare(this._getAuthor(b));
    }

    private _getRating(item: HTMLElement): number {
        const ratingImg = item.querySelector('.fileRating') as HTMLImageElement | null;
        if (!ratingImg) { return 0; }

        const src = ratingImg.src;
        if (src.includes('not-yet')) { return 0; }

        const match = src.match(/(\d)-star\.png/);
        return match && match[1] ? parseInt(match[1], 10) : 0;
    }

    private _getTitle(item: HTMLElement): string {
        return item.querySelector('.workshopItemTitle')?.textContent?.trim().toLowerCase() || '';
    }

    private _getAuthor(item: HTMLElement): string {
        return item.querySelector('.workshopItemAuthorName a')?.textContent?.trim().toLowerCase() || 'zzzzzz';
    }
}
