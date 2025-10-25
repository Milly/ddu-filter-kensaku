# ddu-filter-kensaku

[![license:MIT](https://img.shields.io/github/license/Milly/ddu-filter-kensaku?style=flat-square)](LICENSE)
[![Vim doc](https://img.shields.io/badge/doc-%3Ah_ddu--filter--kensaku-orange.svg?style=flat-square&logo=vim)](doc/ddu-filter-kensaku.txt)

[![Denops 8.0.0 or above](https://img.shields.io/badge/Denops-Support_8.0.0-yellowgreen.svg)](https://github.com/vim-denops/deno-denops-std/tree/v8.0.0)
[![ddu.vim 11.0.0 or above](https://img.shields.io/badge/ddu.vim-Support_11.0.0-yellowgreen.svg)](https://github.com/Shougo/ddu.vim/tree/v11.0.0)

Migemo matcher filter for [ddu.vim]

[Migemo] を利用してローマ字入力により [ddu.vim]
のアイテムから日本語文字列をマッチングします。

単語を空白で区切って入力することで AND 検索ができます。

例: `roma nihongo` で「... ローマ字 ... 日本語 ...」のような文にマッチします。

![ddu-filter-kensaku](https://github.com/user-attachments/assets/e58a0b25-0100-43b5-b759-289465b52a5a)

## Required

以下のプラグインに依存します。

- [denops.vim]
- [ddu.vim]
- [kensaku.vim]

## Installation

1. [Deno] をインストールします。
2. [vim-plug] などを利用してプラグインをインストールします。

```vim:plugins.vim
Plug 'vim-denops/denops.vim'
Plug 'Shougo/ddu.vim'
Plug 'lambdalisue/kensaku.vim'
Plug 'Milly/ddu-filter-kensaku'
```

## Configuration

ddu.vim の設定を行います。

```vim:config.vim
call ddu#custom#patch_global('sourceOptions', #{
      \  _: #{
      \    matchers: ['matcher_kensaku'],
      \  },
      \})

" Option: Enable highlight matched text
call ddu#custom#patch_global('filterParams', #{
    \  matcher_kensaku: #{
    \    highlightMatched: 'Search',
    \  },
    \})
```

### Type-safe Configuration

[ddu.vim] の TypeScript 設定ファイルで型安全に設定できます。

```typescript:config.ts
import { BaseConfig, type ConfigArguments } from "jsr:@shougo/ddu-vim/config";
import type { MatcherKensakuParams } from "jsr:@milly/ddu-filter-matcher-kensaku/types";

export class Config extends BaseConfig {
  override async config({ contextBuilder }: ConfigArguments) {
    contextBuilder.patchGlobal({
      filterParams: {
        matcher_kensaku: {
          highlightMatched: "Special",
        } satisfies MatcherKensakuParams,
      },
    });
  }
}
```

```vim:config.vim
call ddu#custom#load_config("path/to/your/config.ts")
```

[Deno]: https://deno.land/
[Migemo]: http://0xcc.net/migemo/
[ddu.vim]: https://github.com/Shougo/ddu.vim
[denops.vim]: https://github.com/vim-denops/denops.vim
[kensaku.vim]: https://github.com/lambdalisue/kensaku.vim
[vim-plug]: https://github.com/junegunn/vim-plug
