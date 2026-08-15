# Kalliope Syntax for Vim

Syntax highlighting for Kalliope text-format input files.

## Install

Copy or symlink `kalliope.vim` into Vim's syntax directory and the filetype
detection file into Vim's `ftdetect` directory:

```sh
mkdir -p ~/.vim/syntax
mkdir -p ~/.vim/ftdetect
ln -sfn "$PWD/tools/vim-kalliope-syntax/kalliope.vim" ~/.vim/syntax/kalliope.vim
ln -sfn "$PWD/tools/vim-kalliope-syntax/ftdetect/kalliope.vim" ~/.vim/ftdetect/kalliope.vim
```

Enable it for a buffer with:

```vim
:set syntax=kalliope
```
