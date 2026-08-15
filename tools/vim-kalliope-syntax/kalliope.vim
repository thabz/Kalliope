" Vim syntax file
" Language: Kalliope Text Format
" Maintainer: Jesper Christensen
" Latest Revision: 30 April 2020

if exists("b:current_syntax")
  finish
endif

syn match sideText contained '\d\+-\d\+$'
syn match sideText contained '[IVX]\+-[IVX]\+$'
syn match talText contained '\d\+$'
syn match sideFejlText contained '\d\+-$'
syn match layoutStyle contained '[wcsib]\+:'
syn match hrStyle '^---\+$'

syn match textCommand contained 'T:'
syn match textCommand contained 'LINKTITEL:'
syn match textCommand contained 'INDEXTITEL:'
syn match textCommand contained 'TOCTITEL:'
syn match textCommand contained 'U:'
syn match textCommand contained 'F:'
syn match textCommand contained 'TYPE:'
syn match textCommand contained 'DIGTER:'
syn match textCommand contained 'VARIANT:'
syn match textCommand contained 'CREDITS:'
syn match textCommand contained 'FREMFØRT:'
syn match textCommand contained 'BEGIVENHED:'
syn match textCommand contained 'SKREVET:'
syn match textCommand contained 'SIDE:'
syn match textCommand contained 'NOTE:'
syn match textCommand contained 'N:'
syn match todoCommand contained 'TODO:'

syn match workCommand contained 'KILDE:'
syn match workCommand contained 'DIGTER:'
syn match workCommand contained 'FACSIMILE:'
syn match workCommand contained 'FACSIMILE-SIDER:'
syn match workCommand contained 'TITELBLAD:'
syn match workCommand contained 'SEKTION:'
syn match workCommand contained 'SLUT'
syn match workCommand contained 'SLUTSEKTION'

syn match commonError ' ? *$'
syn match commonError ' ! *$'
syn match commonError ' ; *$'
syn match commonError '[^\.] \. *$'
syn match commonError '\\'
syn match commonError '^\. *[a-zA-ZæøåÆØÅ]'

syn sync fromstart
syn region workHeadBlock start='^KILDE:' end='^\s*$' contains=workHeadLine keepend

syn region textHeadLine display oneline start='^T:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^LINKTITEL:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^INDEXTITEL:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^TOCTITEL:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^U:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^F:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^TYPE:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^VARIANT:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^CREDITS:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^FREMFØRT:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^BEGIVENHED:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^SKREVET:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^SIDE:' end='$' contains=textCommand,sideText,talText,sideFejlText
syn region textHeadLine display oneline start='^TODO:' end='$' contains=todoCommand
syn region textHeadLine display oneline start='^NOTE:' end='$' contains=textCommand
syn region textHeadLine display oneline start='^N:' end='$' contains=textCommand

syn region workHeadLine display oneline start='^KILDE:' end='$' contains=workCommand contained
syn region workHeadLine display oneline start='^DIGTER:' end='$' contains=workCommand contained
syn region workHeadLine display oneline start='^FACSIMILE:' end='$' contains=workCommand contained
syn region workHeadLine display oneline start='^FACSIMILE-SIDER:' end='$' contains=workCommand,talText contained
syn region workHeadLine display oneline start='^TITELBLAD:' end='$' contains=workCommand contained
syn region workHeadLine display oneline start='^SEKTION:' end='$' contains=workCommand
syn region workHeadLine display oneline start='^SLUT' end='$' contains=workCommand
syn region workHeadLine display oneline start='^SLUTSEKTION' end='$' contains=workCommand
syn region textHeadLine display oneline start='^DIGTER:' end='$' contains=textCommand

syn region layoutLine   display oneline start='^{' end='}' contains=layoutStyle

let b:current_syntax = "kalliope"

hi def link sideText            Constant
hi def link talText             Constant
hi def link todoCommand         Todo
hi def link textCommand         Type
hi def link workCommand         Statement
hi def link workHeadBlock       PreProc
hi def link textHeadLine        PreProc
hi def link workHeadLine        PreProc
hi def link sideFejlText        WarningMsg
hi def link layoutLine          PreProc
hi def link layoutStyle         Identifier
hi def link commonError         Error
hi def link hrStyle             PreProc
