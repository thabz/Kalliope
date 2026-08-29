autocmd BufRead,BufNewFile *.txt if getline(1) =~# '^KILDE:' | setfiletype kalliope | endif
