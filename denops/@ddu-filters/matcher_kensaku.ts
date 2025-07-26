import type { Denops } from "jsr:@denops/core@^7.0.0";
import {
  BaseFilter,
  type FilterArguments,
} from "jsr:@shougo/ddu-vim@^10.0.0/filter";
import type {
  DduItem,
  FilterOptions,
  ItemHighlight,
  SourceOptions,
} from "jsr:@shougo/ddu-vim@^10.0.0/types";

const MATCHED_HIGHLIGHT_NAME = "ddu-filter-matcher_kensaku-matched";

type Params = {
  /**
   * The highlight group of matched text.
   * If empty, this feature will be disabled.
   *
   * @default {""}
   */
  highlightMatched: string;
};

type ItemHighlightPos = Pick<ItemHighlight, "col" | "width">;

export class Filter extends BaseFilter<Params> {
  override params(): Params {
    return {
      highlightMatched: "",
    };
  }

  override async filter(
    args: FilterArguments<Params>,
  ): Promise<DduItem[]> {
    const {
      denops,
      input,
      items,
      sourceOptions,
      filterOptions,
      filterParams,
    } = args;

    const matchers = await this.#getMatchers(
      denops,
      input,
      sourceOptions,
      filterOptions,
    );
    if (matchers.length === 0) return items;

    let filteredItems = this.#extractMatches(items, matchers);

    if (filterParams.highlightMatched !== "") {
      filteredItems = this.#updateHighlights(
        filteredItems,
        matchers,
        filterParams,
      );
    }

    return filteredItems;
  }

  async #getMatchers(
    denops: Denops,
    input: string,
    { ignoreCase, smartCase }: SourceOptions,
    { minInputLength }: FilterOptions,
  ): Promise<RegExp[]> {
    input = input.trim();
    if (input === "") return [];
    const inputParts = input.split(/\s+/).filter((part) =>
      part.length >= minInputLength
    );
    return await Promise.all(
      inputParts.map(async (text) => {
        let patternFlags = "";
        if (ignoreCase && (!smartCase || !/\p{Lu}/v.test(text))) {
          text = text.toLowerCase();
          patternFlags = "i";
        }
        const pattern = await kensakuQuery(denops, text);
        return new RegExp(pattern, patternFlags);
      }),
    );
  }

  #extractMatches(items: DduItem[], matchers: RegExp[]): DduItem[] {
    return items.filter(({ matcherKey }) =>
      matchers.every((m) => m.test(matcherKey))
    );
  }

  #updateHighlights(
    items: DduItem[],
    matchers: RegExp[],
    { highlightMatched }: Params,
  ): DduItem[] {
    // Add global flag, to get all matches in the item
    const globalMatchers = matchers.map((matcher) =>
      new RegExp(matcher, "g" + matcher.flags)
    );

    const getMatchedRanges = (text: string) =>
      globalMatchers
        // Get matches
        .flatMap((matcher) => [...text.matchAll(matcher)])
        // Convert to ItemHighlightPos
        .map((m): ItemHighlightPos => ({
          col: getByteLength(text.slice(0, m.index!)) + 1,
          width: getByteLength(m[0]),
        }))
        // Sort by ascending `col`
        .toSorted((a, b) => a.col - b.col)
        // Merge overlaps
        .reduce(
          (acc, cur) => {
            const prev = acc.at(-1);
            if (prev && cur.col <= prev.col + prev.width) {
              prev.width = cur.col + cur.width - prev.col;
            } else {
              acc.push(cur);
            }
            return acc;
          },
          [] as ItemHighlightPos[],
        );

    return items.map(
      (item) => {
        const display = item.display ?? item.word;
        const ranges = getMatchedRanges(display);
        const matchedHighlights = ranges
          .map(({ col, width }): ItemHighlight => ({
            name: MATCHED_HIGHLIGHT_NAME,
            "hl_group": highlightMatched,
            col,
            width,
          }));
        const highlightsWithoutMatched =
          item.highlights?.filter(({ name }) =>
            name !== MATCHED_HIGHLIGHT_NAME
          ) ?? [];
        const highlights = [
          ...highlightsWithoutMatched,
          ...matchedHighlights,
        ];
        return { ...item, highlights };
      },
    );
  }
}

const textEncoder = new TextEncoder();

function getByteLength(s: string): number {
  return textEncoder.encode(s).length;
}

function kensakuQuery(denops: Denops, text: string): Promise<string> {
  return denops.dispatch("kensaku", "query", text) as Promise<string>;
}
