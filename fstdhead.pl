#################################################################################
# fheaderHTML
#
# Udskriv header HTML for en forfatter hvis handle er angivet i argument 0.
##################################################################################
do 'kstdhead.pl';

sub udtraektilfheader {
    $fhandle=$_[0];
    ($fid,$ffornavn,$fefternavn,$ffoedt,$fdoed,$fcols,$fthumb,$fpics,$fbio,$flinks,$fsekundaer,$fvaerkerindhold,$fvaerker,$fprosa,$LA) = $dbh->selectrow_array("SELECT fid,fornavn,efternavn,foedt,doed,cols,thumb,pics,bio,links,sekundaer,vaerker,vers,prosa,sprog FROM fnavne WHERE fhandle = '$fhandle'");
    $fnavn=$ffornavn." ".$fefternavn;
    $fsdir = "fdirs/".$fhandle;
}



#********************************
# Print header
#********************************
sub fheaderHTML {

    $LA = "dk" unless (defined $LA && $LA =~ /[a-z]/);

    &udtraektilfheader($_[0]);
    $forfatterekstramenu='';

#Kalliope headeren: (ie. nav. bar)
    $wheretolinklanguage = 'flistaz.pl?';
    $ekstrametakeywords='<META name="keywords" content="'.$fnavn.'">';
    $0 = "forfatter";
    &kheaderHTML("Kalliope - ".$fnavn,$LA);


#Print top of page
goto skip;

print '<table border=0 cellpadding=1 cellspacing=0 width="100%"><tr><td bgcolor=#000000>';
    print '<TABLE cellspacing=0 cellpadding=5 border=0 bgcolor=ffffff BORDER=5 WIDTH="100%"><TR>';
    print '<TD ALIGN="right">';
    if ($fthumb) {
	print '<IMG SRC="../../html/kalliope/fdirs/'.$fhandle.'/thumb.jpg" WIDTH=100 BORDER=0>';
    } else { 
	print '<IMG SRC="../../html/kalliope/gfx/nothumb.gif"><BR>';
    }
    print '</TD><TD WIDTH="100%" ALIGN="right"><FONT SIZE=+3>'.$fnavn.'<BR>';
    print '<HR WIDTH="100%">';
    print " (".$ffoedt."-".$fdoed.")</FONT>";
    print "</TD></TR></TABLE>";
    print "</td></tr></table>";
skip: 
}



##################################################################################
# ffooterHTML
#
# Udskriv footer HTML for en forfatter hvis handle er angivet i argument 0.
# $f* skal være definerede gennem et tidligere kald til fheaderHTML
##################################################################################
sub ffooterHTML {
    &kfooterHTML;
}
