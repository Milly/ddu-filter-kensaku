# ddu-filter-kensaku

[![license:MIT](https://img.shields.io/github/license/Milly/ddu-filter-kensaku?style=flat-square)](LICENSE)
[![Vim doc](https://img.shields.io/badge/doc-%3Ah%20ddu--filter--kensaku-orange.svg?style=flat-square&logo=vim)](doc/ddu-filter-kensaku.txt)

Migemo matcher for ddu.vim

[Migemo][] を利用してローマ字入力により [ddu.vim][] のアイテムから日本語文字列をマッチングします。

単語を空白で区切って入力することで AND 検索ができます。

例: `roma nihongo` で「... ローマ字 ... 日本語 ...」のような文にマッチします。

![ddu-filter-kensaku](https://github.com/user-attachments/assets/e58a0b25-0100-43b5-b759-289465b52a5a)

## Required

以下のプラグインに依存します。

- [denops.vim][]
- [ddu.vim][]
- [kensaku.vim][]

## Installation

1. [Deno][] をインストールします。
2. [vim-plug][] などを利用してプラグインをインストールします。

```
Plug 'vim-denops/denops.vim'
Plug 'Shougo/ddu.vim'
Plug 'lambdalisue/kensaku.vim'
Plug 'Milly/ddu-filter-kensaku'
```

## Configuration

ddu.vim の設定を行います。

```vim
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

[Deno]: https://deno.land/
[Migemo]: http://0xcc.net/migemo/
[ddu.vim]: https://github.com/Shougo/ddu.vim
[denops.vim]: https://github.com/vim-denops/denops.vim
[kensaku.vim]: https://github.com/lambdalisue/kensaku.vim
[vim-plug]: https://github.com/junegunn/vim-plug
