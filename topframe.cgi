#!/usr/bin/perl 

use CGI qw (:standard :html);
do "dbconnect.pl";

$LA = url_param('sprog');
$links='&nbsp;';

if (url_param('type') eq 'forfatter') {
    $fhandle = url_param('fhandle');
    ($fid,$ffornavn,$fefternavn,$ffoedt,$fdoed,$fcols,$fthumb,$fpics,$fbio,$flinks,$fsekundaer,$fvaerkerindhold,$fvaerker,$fprosa) = $dbh->selectrow_array("SELECT fid,fornavn,efternavn,foedt,doed,cols,thumb,pics,bio,links,sekundaer,vaerker,vers,prosa FROM fnavne WHERE fhandle = '$fhandle'");
    $picture = ($fthumb) ? 'fdirs/'.$fhandle.'/thumb.jpg' : 'gfx/nothumb.gif';
    $links = "<TABLE ALIGN=right BORDER=0 CELLPADDING=0 CELLSPACING=0><TR>";
    if ($fvaerker) {
	$links .= '<TD CLASS=minimenu><A CLASS=white TARGET="mainframe" HREF="fvaerker.pl?'.$fhandle.'?'.$LA.'"><IMG HEIGHT=40 BORDER=0 SRC="gfx/books_40.GIF"><BR>Værker</A></TD>';
	$links .= '<TD>&nbsp;&nbsp;</TD>';
    }
    if ($fvaerkerindhold) {
	$links .= "<TD CLASS=minimenu><A CLASS=white  TARGET=\"mainframe\" HREF=\"flines.pl?".$fhandle."?1?$LA\"><IMG HEIGHT=40 BORDER=0 SRC=\"gfx/open_book_40.GIF\"><BR>Digttitler</A></TD>";
	$links .= '<TD>&nbsp;&nbsp;</TD>';
	$links .= "<TD CLASS=minimenu><A CLASS=white  TARGET=\"mainframe\" HREF=\"flines.pl?".$fhandle."?2?$LA\"><IMG HEIGHT=40 BORDER=0 SRC=\"gfx/open_book_40.GIF\"><BR>Førstelinier</A></TD>";
	$links .= '<TD>&nbsp;&nbsp;</TD>';
	$links .= '<TD CLASS=minimenu><A CLASS=white TARGET="mainframe" HREF="fpop.pl?fhandle='.$fhandle.'&sprog='.$LA.'"><IMG HEIGHT=40 BORDER=0 SRC="gfx/heart.gif"><BR>Populære</A></TD>';
	$links .= '<TD>&nbsp;&nbsp;</TD>';
    }
    if ($fprosa) {
	$links .= "<TD CLASS=minimenu><A CLASS=white TARGET=\"mainframe\" HREF=\"fpaerker.pl?".$fhandle."?$LA\"><IMG HEIGHT=40 BORDER=0 SRC=\"gfx/books_40.GIF\"><BR>Prosa</A></TD>";
	$links .= '<TD>&nbsp;&nbsp;</TD>';
    }
    if ($fpics) {
	$links .= "<TD CLASS=minimenu><A CLASS=white TARGET=\"mainframe\"  HREF=\"fpics.pl?".$fhandle."?$LA\"><IMG HEIGHT=40 BORDER=0 SRC=\"gfx/staffeli_40.GIF\"><BR>Portrætter</A></TD>";
	$links .= '<TD>&nbsp;&nbsp;</TD>';
    }
    if ($ffoedt) { #Undgår "Folkeviser" og lignende.
#    if ($fbio) {
	$links .= qq|<TD CLASS="minimenu"><A CLASS="white" TARGET="mainframe" HREF="biografi.cgi?fhandle=$fhandle"><IMG HEIGHT=40 BORDER=0 SRC="gfx/poet_40.GIF"><BR>Biografi</A></TD>|;
	$links .= '<TD>&nbsp;&nbsp;</TD>';
    }
    if ($fsekundaer) {
	$links .= "<TD CLASS=minimenu><A CLASS=white TARGET=\"mainframe\" HREF=\"fsekundaer.pl?".$fhandle."?$LA\"><IMG HEIGHT=40 BORDER=0 SRC=\"gfx/poet_40.GIF\"><BR>Sekundær</A></TD>";
	$links .= '<TD>&nbsp;&nbsp;</TD>';
    }
    if ($flinks) {
	$links .= "<TD CLASS=minimenu><A CLASS=white TARGET=\"mainframe\" HREF=\"flinks.pl?".$fhandle."?$LA\"><IMG HEIGHT=40 WIDTH=40 BORDER=0 SRC=\"gfx/ikon09.gif\"><BR>Links</A></TD>";
	$links .= '<TD>&nbsp;&nbsp;</TD>';
    }    
    $links .= '</TR></TABLE>';
    if ($ffoedt) {
	$titel1 = "$ffornavn $fefternavn <FONT COLOR=#a3c4ed>($ffoedt - $fdoed)</FONT>";
    } else {
	$titel1 = $ffornavn;
    }
} elsif (url_param('type') eq 'kvaerker') {
    $picture = 'gfx/books_100.GIF';
    $titel1 = 'Værker';
    $links = begintoplinks();
    $links .= addtoplink('kvaerker.pl?mode=titel&sprog='.$LA,"gfx/book_40.GIF","Efter titel");
    $links .= addtoplink('kvaerker.pl?mode=aar&sprog='.$LA,"gfx/sundial_40.GIF","Efter år");
    $links .= addtoplink('kvaerker.pl?mode=digter&sprog='.$LA,"gfx/poet_40.GIF","Efter digter");
    $links .= addtoplink('kvaerker.pl?mode=pop&limit=20&sprog='.$LA,"gfx/heart.gif","Populære");
    $links .= endtoplinks();
} elsif (url_param('type') eq 'flist') {
    $titel1 = 'Digtere';
    $picture = 'gfx/poet00_100.GIF';
    $links = begintoplinks();
    $links .= addtoplink("flistaz.pl?$LA","gfx/poet00_40.GIF","Efter navn");
    $links .= addtoplink("flist19.pl?$LA","gfx/sundial_40.GIF","Efter fødeår");
    $links .= addtoplink("flistpics.pl?$LA","gfx/staffeli_40.GIF","Efter udseende");
    $links .= addtoplink("flistbios.cgi?sprog=$LA","gfx/poet_40.GIF","Efter bio");
    $links .= addtoplink('flistpop.pl?limit=20&sprog='.$LA,"gfx/heart.gif","Populære");
    $links .= addtoplink('flistflittige.pl?limit=20&sprog='.$LA,"gfx/ant.gif","Flittige");
    $links .= endtoplinks();
}   elsif (url_param('type') eq 'lines') {
    $titel1 = 'Samtlige digte';
    $picture = 'gfx/open_book_100.GIF';
    $links = begintoplinks();
    $links .= addtoplink("klines.pl?mode=1\&forbogstav=A\&sprog=$LA","gfx/open_book_40.GIF","Titler");
    $links .= addtoplink("klines.pl?mode=0\&forbogstav=A\&sprog=$LA","gfx/open_book_40.GIF","Førstelinier");
    $links .= addtoplink("klines.pl?mode=2\&forbogstav=A\&limit=20\&sprog=$LA","gfx/heart.gif","Populære");
    $links .= endtoplinks();
}  elsif (url_param('type') eq 'stats') {
    $titel1 = 'Statistik';
    $picture = 'gfx/ikon08.gif';
    $links = begintoplinks();
#    $links .= addtoplink("kstats.pl?1?$LA","gfx/ant.gif","Flittigste");
    $links .= addtoplink("kstats.pl?2?$LA","gfx/camera.gif","Fotogene");
    $links .= addtoplink("kstats.pl?3?$LA","gfx/coins.gif","Ærgerrige");
#    $links .= addtoplink("kstats.pl?4?$LA","gfxold/gfx/heart.gif","Populære");
    $links .= addtoplink("kstats.pl?5?$LA","gfx/shelf.gif","Litterære");
#    $links .= addtoplink("kstats.pl?6?$LA","gfx/network.gif","Sidste uge");
#    $links .= addtoplink("kstats.pl?7?$LA","gfx/network.gif","Besøgende");
    $links .= addtoplink("kstats.pl?10?$LA","gfx/network.gif","Traffik");
#    $links .= addtoplink("kstats.pl?9?$LA","gfx/heart.gif","Top 20");
    $links .= endtoplinks();
} elsif (url_param('type') eq 'hpage' ){
    $picture = 'gfx/sundial_100.GIF';
    $titel1 = url_param('titel');
    $links = begintoplinks();
    $links .= addtoplink("hindex.pl?$LA","gfx/sundial_40.GIF","Artikler");
    $links .= addtoplink('keywordtoc.cgi?sprog='.$LA,"gfx/sundial_40.GIF","Nøgleord");
    $links .= addtoplink("timeline.cgi?sprog=$LA","gfx/sundial_40.GIF","Tidslinie");
    $links .= endtoplinks();
} elsif (url_param('type') eq 'search') {
    $picture = 'gfx/search_100.GIF';
    $titel1 = 'Søgning';
} elsif (url_param('type') eq 'forside' or url_param('type') eq 'om') {
    $picture = 'gfx/book_100.GIF';
    $titel1 = 'Kalliope - digtarkiv';
    $links = begintoplinks();
    $links .= addtoplink('kfront.pl?'.$LA,"gfx/pressroom.gif","Nyheder");
    $links .= addtoplink('kabout.pl?about.html?'.$LA,"gfx/info.gif","Info");
    $links .= addtoplink('kabout.pl?musen.html?'.$LA,"gfx/mouse.gif","Musen");
    $links .= addtoplink('kabout.pl?tak.html?'.$LA,"gfx/apple.gif","Tak");
    $links .= addtoplink('kabout.pl?links.html?'.$LA,"gfx/globe.gif","Links");
    $links .= addtoplink('gaestebogvis.pl?'.$LA,"gfx/book.gif","Gæstebog");
    $links .= addtoplink('kabout.pl?teknisk.html?'.$LA,"gfx/database.gif","Teknisk");
    $links .= addtoplink('kstats.pl?10?'.$LA,"gfx/equationpen.gif","Statistik");
    $links .= endtoplinks();
}  elsif (url_param('type') eq 'om') {
    $picture = 'gfx/book_100.GIF';
    $titel1 = 'Om Kalliope';
    $links = begintoplinks();
    $links .= addtoplink('kabout.pl?musen.html?'.$LA,"gfxold/gfx/mouse.gif","Musen");
    $links .= addtoplink('kabout.pl?tak.html?'.$LA,"gfxold/gfx/apple.gif","Tak");
    $links .= addtoplink('kabout.pl?teknisk.html?'.$LA,"gfxold/gfx/database.gif","Teknisk");
    $links .= endtoplinks();
} elsif (url_param('type') eq 'normal') { 
    $titel1 = url_param('titel');
} else {
    $titel1 = "Kalliope";
}


print "Content-type: text/html\n\n";
print <<"EOF";
<HTML><HEAD>
<LINK REL="stylesheet" TYPE="text/css" HREF="kalliope.css">
</HEAD>
<BODY LINK=white VLINK=white ALINK=white CLASS=leftframe LEFTMARGIN=0 TOPMARGIN=0 MARGINHEIGHT=0 MARGINWIDTH=0>
EOF
if ($picture) {
print qq(<DIV STYLE="position: absolute; left: 150px; top: 0px; height:100px; width: 10px"><IMG HEIGHT=100 SRC="$picture"></DIV>);
}

print <<"EOF";
<TABLE WIDTH="100%" BORDER=0 CELLSPACING=0 CELLPADDING=0 HEIGHT="100%">
<TR><TD WIDTH="100" VALIGN=top ROWSPAN=2><A HREF="index.cgi" TARGET="_top">
<!--<IMG SRC="gfx/nytcorn.mindre.gif" BORDER=0>-->
<IMG BORDER=0 VALIGN=top HEIGHT=100 WIDTH=120 SRC="gfx/trans1x1.gif">
&nbsp;
</A></TD>
<TD HEIGHT=40 WIDTH="100%" CLASS=topframetitel BGCOLOR="#6384ad">$titel1&nbsp;</TD></TR>
<!--<TR><TD HEIGHT=400 CLASS=minimenu ALIGN=right WIDTH="100%" HEIGHT="100%" VALIGN=top BGCOLOR="#7394ad">$links</TD></TR>-->
<TR><TD HEIGHT=400 CLASS=minimenu ALIGN=right WIDTH="100%" HEIGHT="100%" VALIGN=top BACKGROUND="gfx/pap.gif">$links</TD>
<TD ROWSPAN=2>
<IMG BORDER=0 VALIGN=top WIDTH=16 SRC="gfx/trans1x1.gif">
</TD>
</TR>
</TABLE>
EOF

print '</BODY></HTML>';



sub begintoplinks {
   return "<TABLE ALIGN=right BORDER=0 CELLPADDING=2 CELLSPACING=1><TR>";
}

sub endtoplinks {
    return '</TR></TABLE>';
}

sub addtoplink {
    my ($url,$ikon,$text) = @_;
    return '<TD CLASS=minimenu><A CLASS=white TARGET="mainframe" HREF="'.$url.'"><IMG HEIGHT=40 BORDER=0 SRC="'.$ikon.'"><BR>'.$text.'</A></TD><TD>&nbsp;&nbsp;</TD>';
}
