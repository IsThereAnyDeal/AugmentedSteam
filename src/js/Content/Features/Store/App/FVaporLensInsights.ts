import type CApp from '@Content/Features/Store/App/CApp';
import Feature from '@Content/Modules/Context/Feature';
import SessionCacheApiFacade from '@Content/Modules/Facades/SessionCacheApiFacade';
import Settings from '@Options/Data/Settings';
import self_ from './FVaporLensInsights.svelte';
import type {
  VaporLensEntry,
  VaporLensResponse,
  VaporLensSection,
} from './VaporLens.types';

interface VaporLensViewModel {
  name?: string;
  categories: string[];
  summary: string[];
}

const SECTION_ORDER = [
  'positives',
  'negatives',
  'gameplay',
  'performance',
  'recommendations',
  'misc',
] as const;

type SectionKey = (typeof SECTION_ORDER)[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  positives: 'Positives',
  negatives: 'Negatives',
  gameplay: 'Gameplay',
  performance: 'Performance',
  recommendations: 'Recommendations',
  misc: 'Miscellaneous',
};

const CACHE_PREFIX = 'store:vaporlens';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 12 hours

interface VaporLensCacheEntry {
  viewModel: VaporLensViewModel | null;
  sections: VaporLensSection[];
  expiresAt: number;
}

export default class FVaporLensInsights extends Feature<CApp> {
  private _viewModel: VaporLensViewModel | null = null;
  private _sections: VaporLensSection[] = [];
  private _insertAfter: Element | null = null;

  override async checkPrerequisites(): Promise<boolean> {
    if (!Settings.showvaporlenssummary) {
      return false;
    }

    this._insertAfter = document.querySelector('.review_score_summaries');
    if (!this._insertAfter) {
      return false;
    }

    const cached = await this._loadFromCache();
    if (cached) {
      if (!cached.viewModel) {
        return false;
      }
      this._viewModel = cached.viewModel;
      this._sections = cached.sections;
      return true;
    }

    try {
      const response = await fetch(
        `https://vaporlens.app/api/app/${this.context.appid}`,
        {
          credentials: 'omit',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const payload = (await response.json()) as VaporLensResponse;
      if (!payload || typeof payload !== 'object') {
        return false;
      }
      const categories = this._sanitizeStringArray(payload.categories);
      const summary = this._sanitizeStringArray(payload.summary);
      const sections = this._buildSections(payload);

      if (!categories.length && !summary.length && sections.length === 0) {
        await this._saveToCache(null, []);
        return false;
      }

      this._viewModel = {
        name: typeof payload.name === 'string' ? payload.name : undefined,
        categories,
        summary,
      };
      this._sections = sections;
      await this._saveToCache(this._viewModel, this._sections);
      return true;
    } catch (error) {
      this.logError(error, 'Failed to fetch VaporLens insights');
      return false;
    }
  }

  override apply(): void {
    if (!this._viewModel || !this._insertAfter) {
      return;
    }

    const mountPoint = document.createElement('div');
    this._insertAfter.insertAdjacentElement('afterend', mountPoint);

    new self_({
      target: mountPoint,
      props: {
        appName: this._viewModel.name,
        categories: this._viewModel.categories,
        summary: this._viewModel.summary,
        sections: this._sections,
        sourceUrl: `https://vaporlens.app/app/${this.context.appid}`,
      },
    });
  }

  private async _loadFromCache(): Promise<VaporLensCacheEntry | null> {
    try {
      const cached = await SessionCacheApiFacade.get<VaporLensCacheEntry>(
        CACHE_PREFIX,
        String(this.context.appid)
      );
      if (!cached || cached.expiresAt <= Date.now()) {
        return null;
      }
      return cached;
    } catch (error) {
      this.logError(error, 'Failed to read VaporLens cache');
      return null;
    }
  }

  private async _saveToCache(
    viewModel: VaporLensViewModel | null,
    sections: VaporLensSection[]
  ): Promise<void> {
    try {
      await SessionCacheApiFacade.set(
        CACHE_PREFIX,
        String(this.context.appid),
        {
          viewModel,
          sections,
          expiresAt: Date.now() + CACHE_TTL_MS,
        }
      );
    } catch (error) {
      this.logError(error, 'Failed to write VaporLens cache');
    }
  }

  private _buildSections(payload: VaporLensResponse): VaporLensSection[] {
    const sectionsMap = SECTION_ORDER.reduce<
      Record<SectionKey, VaporLensSection>
    >((acc, key) => {
      acc[key] = {
        key,
        label: SECTION_LABELS[key],
        entries: [],
      };
      return acc;
    }, {} as Record<SectionKey, VaporLensSection>);

    for (const [key, value] of Object.entries(payload)) {
      if (key === 'name' || key === 'categories' || key === 'summary') {
        continue;
      }

      if (!Array.isArray(value) || value.length === 0) {
        continue;
      }

      const typedValue = value as unknown[];
      if (typeof typedValue[0] === 'string') {
        continue;
      }

      const entries = typedValue
        .map((item) => this._normalizeEntry(item))
        .filter((entry): entry is VaporLensEntry => entry !== null);

      if (!entries.length) {
        continue;
      }

      const normalizedKey = this._normalizeSectionKey(key);
      const mergedEntries = [...sectionsMap[normalizedKey].entries, ...entries];
      sectionsMap[normalizedKey].entries = this._sortEntries(mergedEntries);
    }

    return SECTION_ORDER.map((key) => sectionsMap[key]);
  }

  private _normalizeEntry(item: unknown): VaporLensEntry | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const point =
      'point' in item
        ? String((item as Record<string, unknown>).point ?? '').trim()
        : '';
    const explanation =
      'explanation' in item
        ? String((item as Record<string, unknown>).explanation ?? '').trim()
        : '';
    const rawImportance =
      'importance' in item
        ? Number((item as Record<string, unknown>).importance)
        : null;
    let importance: number | null = null;
    if (typeof rawImportance === 'number' && Number.isFinite(rawImportance)) {
      importance = this._clampImportance(rawImportance);
    }

    if (!point && !explanation) {
      return null;
    }

    return {
      point: point || (explanation ? explanation.slice(0, 64) : 'Insight'),
      explanation: explanation || null,
      importance,
    };
  }

  private _sortEntries(entries: VaporLensEntry[]): VaporLensEntry[] {
    return [...entries].sort(
      (a, b) => (b.importance ?? 0) - (a.importance ?? 0)
    );
  }

  private _clampImportance(value: number): number {
    if (Number.isNaN(value)) {
      return 0;
    }
    if (value < 0) {
      return 0;
    }
    if (value > 1) {
      return 1;
    }
    return value;
  }

  private _normalizeSectionKey(key: string): SectionKey {
    if (SECTION_ORDER.includes(key as (typeof SECTION_ORDER)[number])) {
      return key as SectionKey;
    }
    return 'misc';
  }

  private _sanitizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(
        (item, index, arr): item is string =>
          Boolean(item) && arr.indexOf(item) === index
      );
  }
}
