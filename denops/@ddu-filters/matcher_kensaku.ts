import {
  BaseFilter,
  type DduItem,
  type ItemHighlight,
  type SourceOptions,
} from "https://deno.land/x/ddu_vim@v2.8.5/types.ts";
import type { FilterArguments } from "https://deno.land/x/ddu_vim@v2.8.5/base/filter.ts";
import type { Denops } from "https://deno.land/x/ddu_vim@v2.8.5/deps.ts";

const MATCHED_HIGHLIGHT_NAME = "matched";

type Params = {
  /**
   * The highlight group of matched text.
   * If empty, this feature will be disabled.
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
    { denops, input, items, sourceOptions, filterParams }: FilterArguments<
      Params
    >,
  ): Promise<DduItem[]> {
    const matchers = await this.#getMatchers(denops, input, sourceOptions);
    if (matchers.length === 0) return items;

    items = this.#extractMatches(items, matchers);

    if (filterParams.highlightMatched !== "") {
      items = this.#updateHighlights(items, matchers, filterParams);
    }

    return items;
  }

  async #getMatchers(
    denops: Denops,
    input: string,
    { ignoreCase }: SourceOptions,
  ): Promise<RegExp[]> {
    input = input.trim();
    if (input === "") return [];
    if (ignoreCase) {
      input = input.toLowerCase();
    }
    // No global flag, because it only needs to match once to extract
    const patternFlags = ignoreCase ? "i" : "";
    return await Promise.all(
      input.split(/\s+/).map(async (text) => {
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
        const matchedHighlights = ranges.map(({ col, width }) => ({
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

function getByteLength(s: string): number {
  return (new TextEncoder()).encode(s).length;
}

function kensakuQuery(denops: Denops, text: string): Promise<string> {
  return denops.dispatch("kensaku", "query", text) as Promise<string>;
}
