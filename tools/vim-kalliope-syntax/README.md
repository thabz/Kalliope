# Kalliope Syntax for Vim

Syntax highlighting for Kalliope `old2kalliope` input files.

## Install

Copy or symlink `kalliope.vim` into Vim's syntax directory:

```sh
mkdir -p ~/.vim/syntax
ln -sfn "$PWD/tools/vim-kalliope-syntax/kalliope.vim" ~/.vim/syntax/kalliope.vim
```

Enable it for a buffer with:

```vim
:set syntax=kalliope
```

To enable it automatically for the current Kalliope conversion file, add an autocmd to `~/.vim/ftdetect/kalliope.vim`:

```vim
autocmd BufRead,BufNewFile */kalliope/efterklang.txt setfiletype kalliope
```

If you use other `old2kalliope` input filenames, add them to the same autocmd pattern.
