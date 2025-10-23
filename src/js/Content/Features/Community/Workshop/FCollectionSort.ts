import type Context from "@Content/Modules/Context/Context";
import Feature from "@Content/Modules/Context/Feature";
import {L} from "@Core/Localization/Localization";
import HTML from "@Core/Html/Html";
import {
    __workshop_collectionSortAuthor,
    __workshop_collectionSortBy,
    __workshop_collectionSortDefault,
    __workshop_collectionSortRating,
    __workshop_collectionSortSubscription,
    __workshop_collectionSortTitle
} from "@Strings/_strings";

type SortCriteria = 'subscription' | 'rating' | 'title' | 'author';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    criteria: SortCriteria[];
    directions: Record<SortCriteria, SortDirection>;
}

export default class FCollectionSort extends Feature<Context> {

    private _originalOrder: HTMLElement[] = [];

    override checkPrerequisites(): boolean {
        return document.querySelector('.collectionItem') !== null;
    }

    override apply(): void {
        const collectionChildren = document.querySelector('.collectionChildren');
        if (collectionChildren) {
            this._originalOrder = Array.from(
                collectionChildren.querySelectorAll('.collectionItem')
            ) as HTMLElement[];
        }

        this._addSortControls();
    }

    private _addSortControls(): void {
        const collectionChildren = document.querySelector('.collectionChildren');
        if (!collectionChildren?.parentElement) { return; }

        const sortContainer = HTML.toElement(
            `<div class="es_collection_sort">
                <span class="es_sort_label">${L(__workshop_collectionSortBy)}</span>
                <button class="es_sort_btn" data-sort="" data-criteria="">
                    ${L(__workshop_collectionSortDefault)}
                </button>
                <button class="es_sort_btn" data-sort="subscription:desc" data-criteria="subscription">
                    ${L(__workshop_collectionSortSubscription)}
                </button>
                <button class="es_sort_btn" data-sort="rating:desc" data-criteria="rating">
                    ${L(__workshop_collectionSortRating)}
                </button>
                <button class="es_sort_btn" data-sort="title:desc" data-criteria="title">
                    ${L(__workshop_collectionSortTitle)}
                </button>
                <button class="es_sort_btn" data-sort="author:desc" data-criteria="author">
                    ${L(__workshop_collectionSortAuthor)}
                </button>
            </div>`
        ) as HTMLElement;

        collectionChildren.parentElement.insertBefore(sortContainer, collectionChildren);
        this._attachEventHandlers(sortContainer);
    }

    private _attachEventHandlers(sortContainer: HTMLElement): void {
        const buttons = sortContainer.querySelectorAll<HTMLButtonElement>('.es_sort_btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const criteria = btn.dataset.criteria || '';

                // Handle default button click
                if (!criteria) {
                    this._resetAllButtons(buttons);
                    btn.classList.add('active');
                    this._sortCollection('');
                    return;
                }

                // Handle sort button toggle
                this._toggleButton(btn, buttons);
            });
        });

        // Set default button as active initially
        buttons[0]?.classList.add('active');
    }

    private _resetAllButtons(buttons: NodeListOf<HTMLButtonElement>): void {
        buttons.forEach(btn => {
            btn.classList.remove('active');
            delete btn.dataset.direction;

            // Reset button text to original (no arrow)
            const criteria = btn.dataset.criteria;
            if (criteria) {
                const baseText = btn.textContent?.replace(/\s*[↑↓]\s*$/, '').trim() || '';
                btn.textContent = baseText;
            }
        });
    }

    private _toggleButton(btn: HTMLButtonElement, buttons: NodeListOf<HTMLButtonElement>): void {
        const currentDir = btn.dataset.direction;

        // Remove default button active state when any sort is clicked
        if (!currentDir) {
            buttons[0]?.classList.remove('active');
        }

        let newDir: SortDirection;

        if (!currentDir) {
            // First click - activate with default direction
            newDir = btn.dataset.sort?.includes(':desc') ? 'desc' : 'asc';
            btn.dataset.direction = newDir;
            btn.classList.add('active');
        } else if (currentDir === 'desc') {
            // Second click - toggle to ascending
            newDir = 'asc';
            btn.dataset.direction = newDir;
        } else {
            // Third click - deactivate
            btn.classList.remove('active');
            delete btn.dataset.direction;

            // Reset button text (no arrow)
            const baseText = btn.textContent?.replace(/\s*[↑↓]\s*$/, '').trim() || '';
            btn.textContent = baseText;

            // Check if any sort buttons are still active
            const anyActive = Array.from(buttons).some(b =>
                b.classList.contains('active') && b.dataset.criteria
            );

            if (!anyActive) {
                // No sorts active, return to default
                buttons[0]?.classList.add('active');
                this._sortCollection('');
            } else {
                // Update sort with remaining active buttons
                this._updateSort(buttons);
            }
            return;
        }

        // Update button text with current direction arrow
        const baseText = btn.textContent?.replace(/\s*[↑↓]\s*$/, '').trim() || '';
        btn.textContent = `${baseText} ${newDir === 'desc' ? '↓' : '↑'}`;

        // Apply sort with all active buttons
        this._updateSort(buttons);
    }

    private _updateSort(buttons: NodeListOf<HTMLButtonElement>): void {
        const sortParts: string[] = [];

        buttons.forEach(btn => {
            if (btn.classList.contains('active') && btn.dataset.criteria) {
                const criteria = btn.dataset.criteria!;
                const direction = btn.dataset.direction || 'desc';
                sortParts.push(`${criteria}:${direction}`);
            }
        });

        this._sortCollection(sortParts.join(','));
    }

    private _sortCollection(sortString: string): void {
        const collectionChildren = document.querySelector('.collectionChildren');
        if (!collectionChildren) { return; }

        let items: HTMLElement[];

        if (!sortString) {
            // Restore original order
            items = this._originalOrder;
        } else {
            items = Array.from(
                collectionChildren.querySelectorAll('.collectionItem')
            ) as HTMLElement[];

            if (items.length === 0) { return; }

            const config = this._parseSortConfig(sortString);
            items.sort((a, b) => this._compareItems(a, b, config));
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

    private _parseSortConfig(sortString: string): SortConfig {
        const parts = sortString.split(',');
        const criteria: SortCriteria[] = [];
        const directions: Record<string, SortDirection> = {} as Record<SortCriteria, SortDirection>;

        for (const part of parts) {
            const [criterion, direction] = part.split(':') as [SortCriteria, SortDirection];
            criteria.push(criterion);
            directions[criterion] = direction;
        }

        // Always add title as final tiebreaker if not already present
        if (!criteria.includes('title')) {
            criteria.push('title');
            directions['title'] = 'asc';
        }

        return {criteria, directions};
    }

    private _compareItems(a: HTMLElement, b: HTMLElement, config: SortConfig): number {
        for (const criterion of config.criteria) {
            const direction = config.directions[criterion];
            let result = 0;

            switch (criterion) {
                case 'subscription':
                    result = this._compareSubscription(a, b);
                    break;
                case 'rating':
                    result = this._compareRating(a, b);
                    break;
                case 'title':
                    result = this._compareTitle(a, b);
                    break;
                case 'author':
                    result = this._compareAuthor(a, b);
                    break;
            }

            if (result !== 0) {
                return direction === 'desc' ? -result : result;
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
