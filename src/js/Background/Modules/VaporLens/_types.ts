export interface TVaporLensEntry {
    point: string;
    explanation?: string | null;
    importance?: number | null;
}

export interface TVaporLensResponse {
    name?: string;
    categories?: string[];
    summary?: string[];
    positives?: TVaporLensEntry[];
    negatives?: TVaporLensEntry[];
    gameplay?: TVaporLensEntry[];
    performance?: TVaporLensEntry[];
    recommendations?: TVaporLensEntry[];
    general?: TVaporLensEntry[];
    misc?: TVaporLensEntry[];
    [key: string]: unknown;
}
