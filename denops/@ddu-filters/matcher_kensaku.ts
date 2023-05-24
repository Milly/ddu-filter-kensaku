import {
  BaseFilter,
  type DduItem,
} from "https://deno.land/x/ddu_vim@v2.8.5/types.ts";
import type { FilterArguments } from "https://deno.land/x/ddu_vim@v2.8.5/base/filter.ts";
import type { Denops } from "https://deno.land/x/ddu_vim@v2.8.5/deps.ts";

type Params = {
  highlightMatched: string;
};

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
    input = input.trim();
    if (input === "") return items;

    if (sourceOptions.ignoreCase) {
      input = input.toLowerCase();
    }

    const patterns = await Promise.all(
      input.split(/\s+/).map((text) => kensakuQuery(denops, text)),
    );
    const patternFlags = [
      sourceOptions.ignoreCase ? "i" : "",
    ].join("");
    const matchers = patterns.map((pattern) =>
      new RegExp(pattern, patternFlags)
    );

    items = matchers.reduce(
      (items, matcher) =>
        items.filter(({ matcherKey }) => matcher.test(matcherKey)),
      items,
    );

    if (filterParams.highlightMatched !== "") {
      // Highlight matched text
      const globalMatchers = matchers.map((matcher) =>
        new RegExp(matcher, "g" + matcher.flags)
      );
      items = items.map(
        (item) => {
          const display = item.display ?? item.word;
          const highlights = item.highlights?.filter(({ name }) =>
            name != "matched"
          ) ?? [];
          const matches = globalMatchers.flatMap(
            (matcher) => [...display.matchAll(matcher)]
          );
          highlights.push(
            ...matches.map((m) => ({
              name: "matched",
              "hl_group": filterParams.highlightMatched,
              col: getByteLength(display.slice(0, m.index ?? 0)) + 1,
              width: getByteLength(m[0]),
            })),
          );
          return { ...item, highlights };
        },
      );
    }

    return items;
  }
}

function getByteLength(s: string): number {
  return (new TextEncoder()).encode(s).length;
}

function kensakuQuery(denops: Denops, text: string): Promise<string> {
  return denops.dispatch("kensaku", "query", text) as Promise<string>;
}
