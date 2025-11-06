
export type SortDirection = 1 | -1;

export const enum ESortCriteria {
    Subscription,
    Rating,
    Title,
    Author
}

export type SortConfig = Map<ESortCriteria, SortDirection>;
