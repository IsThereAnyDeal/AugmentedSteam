export interface VaporLensEntry {
    point: string;
    explanation?: string | null;
    importance?: number | null;
}

export interface VaporLensSection {
    key: string;
    label: string;
    entries: VaporLensEntry[];
}

export interface VaporLensResponse {
    name?: string;
    categories?: string[];
    summary?: string[];
    positives?: VaporLensEntry[];
    negatives?: VaporLensEntry[];
    gameplay?: VaporLensEntry[];
    performance?: VaporLensEntry[];
    recommendations?: VaporLensEntry[];
    general?: VaporLensEntry[];
    misc?: VaporLensEntry[];
    [key: string]: unknown;
}
