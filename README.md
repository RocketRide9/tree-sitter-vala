## tree-sitter-vala

VBB's fork of https://github.com/vala-lang/tree-sitter-vala until changes are merged into the main repository.

### Prerequisites

1. Install tree-sitter CLI. `tree-sitter-cli` package on most linux distros.
2. If you want be able to test formating, initialize config using `tree-sitter init-config`. Then add path of this repository's parent directory to `parser-directories`.

### Editing

1. Edit `grammar.js`
2. `tree-sitter generate`
3. `tree-sitter test`

You can use `tree-sitter parse <file>` and `tree-sitter highlight <file>` after
regenerating.

### Zed integration

https://github.com/RocketRide9/zed-vala extension uses this grammar and provides support for Zed editor. You will have to build it yourself.
1. Make sure you have rust toolchain installed. You will need nightly version for Zed Preview.
2. Clone https://github.com/RocketRide9/zed-vala
3. Open `Extensions` page in Zed and click `Install Dev Extension`
4. Select cloned repository
5. If build fails you can press `F1` and select `zed: open log` command to see build errors.
6. If build was successful it should just work.

### Neovim integration

For a working neovim integration you need to install this grammar with

```
:TSInstall vala
```

And you need to install the [vala.vim](https://github.com/vala-lang/vala.vim) plugin to recognize the filetype.

For [vim-plug](https://github.com/junegunn/vim-plug) this would be:

```
Plug 'vala-lang/vala.vim'
```

Then install with

```
:PlugUpdate
```

For other plugin mangers consider the install steps will be different.
