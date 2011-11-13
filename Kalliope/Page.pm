#  Copyright (C) 1999-2011 Jesper Christensen 
#
#  This script is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License as
#  published by the Free Software Foundation; either version 2 of the
#  License, or (at your option) any later version.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this script; if not, write to the Free Software
#  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
#
#  Author: Jesper Christensen <jesper@kalliope.org>
#
#  $Id$

package Kalliope::Page;

use Kalliope::Web ();
use Kalliope::Page::Print();
use Kalliope::Forum ();
use Kalliope::User();
use CGI::Cookie ();
use CGI ();
use strict;

sub new {
    my ($class,%args) = @_;

    if (defined $args{'printer'} && $args{'printer'} == 1) {
	$class = 'Kalliope::Page::Print';
    }
    
    my $self = bless {}, $class;

    $self->{'pagegroupchoosen'} = '';
    $self->{'coloumnwidths'} = [];

    foreach my $key (keys %args) {
        $self->{$key} = $args{$key};
    }
    $self->{'lang'} = $args{'lang'} || 'dk';
    $self->{'pagegroup'} = $args{'pagegroup'} || '';
    $self->{'page'} = $args{'page'} || '';
    $self->{'thumb'} = $args{'thumb'};
    $self->{'icon'} = $args{'icon'} || 'poet-red';
    $self->{'title'} = $args{'title'};
    $self->{'subtitle'} = $args{'subtitle'} || '';
    $self->{'nosubmenu'} = $args{'nosubmenu'} || 0;
    $self->{'columns'} = [];
    
    if ($self->{'setremoteuser'}) {
        my $cookie = new CGI::Cookie(-expires => '+3M',
  	                             -name => 'user',
	                             -value => $self->{'setremoteuser'});
    	$self->{'cookies'} = [$cookie];
    }
    if ($self->{'removeremoteuser'}) {
        my $cookie = new CGI::Cookie(-expires => '-1M',
  	                             -name => 'user',
	                             -value => 0);
    	$self->{'cookies'} = [$cookie];
    }

    if ($args{'changelangurl'}) {
        $self->{'changelangurl'} = $args{'changelangurl'};
    } elsif ($self->{'poet'}) {
	$self->{'changelangurl'} = 'poets.cgi?list=az&amp;sprog=XX';
    } else {
	$ENV{REQUEST_URI} =~ /([^\/]*)$/;
	$self->{'changelangurl'} = $1;
    }
    return $self;
}

sub newAuthor {
    my ($class,%args) = @_;
    my $poet = $args{'poet'};
    my $group = $poet->getType ne 'person' ? 'persons' : 'poets';
    my $page = new Kalliope::Page(pagegroupchoosen => $group, 
                                  title => $poet->name,
                                  coloumnwidths => $args{'coloumnwidths'},
				                  subtitle => $args{'subtitle'},
                                  lang => $poet->lang,  %args);
    return $page;
}

sub lang {
    return shift->{'lang'};
}

sub addHTML {
    my ($self,$HTML,%args) = @_;
    my $coloumn = $args{'coloumn'} || 0;
    @{$self->{'coloumns'}}[$coloumn] .= $HTML;
}

sub thumbIMG {
    my $self = shift;
    my ($src,$alt,$href) = ('','','');
    if ($self->{'poet'} && $self->{'poet'}->thumbURI) {
        my $poet = $self->{'poet'};
        $src = $poet->thumbURI;
	$alt = 'Tilbage til hovedmenuen for '.$poet->name;
	$href = 'ffront.cgi?fhandle='.$poet->fhandle;
    } elsif ($self->{'thumb'}) {
        $src = $self->{'thumb'};
    }
    my $img = qq|<IMG BORDER=0 ALT="$alt" HEIGHT=70 SRC="$src">| if $src;
    my $a = qq|<A HREF="$href" TITLE="$alt">$img</A>| if $href; 
    return $a || $img || '';
}

sub pageIcon {
    my $self = shift;
    if ($self->{'poet'}) {
        return $self->{'poet'}->icon;
    } else {
        return "gfx/frames/$$self{'icon'}.gif";
    }
}

sub titleAsHTML {
    my $self = shift;
    my $title;
    my $subtitle;
    if ($self->{'poet'}) {
        $title = $self->{'poet'}->name;
        $subtitle = $self->{'subtitle'};
#$subtitle = $self->{'poet'}->lifespan;
    } else {
        $title = $self->{'title'};
        $subtitle = $self->{'subtitle'};
    }
    my $result = $title;
    $result .= qq|<br><span class="subtitle">$subtitle</span>| if $subtitle;
    return $result;
}

sub titleForWindow {
    my $self = shift;
    if ($self->{'frontpage'}) {
        return 'Kalliope';
    } elsif ($self->{'extrawindowtitle'}) {
        return $self->{'extrawindowtitle'}.' - '.$self->{'title'}.' - Kalliope';

    } else {
        return $self->{'title'}.' - Kalliope'
    }
}


sub setColoumnWidths {
    my ($self,@widths) = @_;
    $self->{'coloumnwidths'} = \@widths;
}

sub getColoumnWidths {
    my $self = shift; 
    if ($self->{'poet'} && !$self->{'coloumnwidths'}) {
        return ('200','100%','200');
    }
    return $self->{'coloumnwidths'} ? @{$self->{'coloumnwidths'}} : ('100%');
}

sub _constructBreadcrumbs {
    my $self = shift;
    return '' unless $self->{'crumbs'};
    my @crumbs = (
                ['&nbsp;&nbsp;Kalliope','index.cgi'],
                @{$self->{'crumbs'}});
    my @blocks;
    foreach my $item (@crumbs) {
       if ($$item[1]) {
          push @blocks,qq|<A HREF="$$item[1]">$$item[0]</A>|;
       } else {
          push @blocks,$$item[0];
       }
    }
    return join ' >> ',@blocks;
}

sub addBox {
    my ($self,%args) = @_;
    my $align =  $args{align} ? $args{align} : 'left';
    my $theme = $args{'theme'} || 'normal';
    my $HTML;
    $HTML .= qq|\n<div class="box$theme" style="text-align: $align">|;
    if ($args{title}) {
	    $HTML .= qq|<div class="listeoverskrifter">$args{title}</div><br>|;
    }
    $HTML .= $args{content};
    if ($args{end}) {
	    $HTML .= $args{end};
    }
    $HTML .= "</div> <!-- box -->";
    $self->addHTML($HTML, %args);
}

sub addFrontMenu {
    my ($self,@menuStruct) = @_;
    my @activeItems = grep { $_->{'status'} } @menuStruct;
    my $itemsNum = $#activeItems+1;

    $self->setColoumnWidths(50,50);

    my $splitAt = int(($itemsNum+1) / 2);

#    my $HTML = '<TABLE WIDTH="100%"><TR><TD CLASS="ffront" VALIGN="top" WIDTH="50%">';
#    $HTML .= '<TABLE CELLPADDING=2 CELLSPACING=0>';

    my $i = 0;
    foreach my $str (@activeItems) {
	    my %item = %{$str};
	    my $url = $item{url};
	    if ($item{status}) {
	        my $HTML = '<div class="frontmenu-item">';
	        $HTML .= qq|<div class="icon"><a href="$url"><img height=48 border="0" src="$item{icon}" alt="#"></a></div>|;
	        $HTML .= qq|<div class="title"><a href="$url">$item{title}</a></div>|;
	        $HTML .= qq|<div class="descr"><a href="$url">$item{desc}</a></div>|;
	        $HTML .= qq|<div class="clear"></div>|;
	        $HTML .= '</div> <!-- frontmenu-item -->';
	        $self->addBox(coloumn => $i++ < $splitAt ? 0 : 1,
	                      content => $HTML);
	        #$page->addBox( width => '80%',
            #	coloumn => 1,
            #	content => $HTML );
            
        }
	    #    $HTML .= qq|<TR><TD VALIGN="top" ROWSPAN=2><A HREF="$url"><IMG HEIGHT=48 BORDER=0 SRC="$item{icon}" alt="#"></A></TD>|;
	    #    $HTML .= qq|<TD CLASS="ffronttitle"><A HREF="$url">$item{title}</A><TD></TR>|;
	    #    $HTML .= qq|<TR><TD VALIGN="top" CLASS="ffrontdesc">$item{desc}</TD></TR>|;
	    #    $HTML .= qq|<tr><td></td></tr>|;
	    #    $HTML .= '</TABLE></TD><TD CLASS="ffront" VALIGN="top" WIDTH="50%"><TABLE CELLPADDING=2 CELLSPACING=0>' if (++$i == int (($itemsNum + 1 )/2 ));
	    
    }
#    $HTML .= '</TABLE></TD></TR></TABLE>';
#    return $HTML;
}


sub print {
    my $self = shift;
    my $titleForWindow = $self->titleForWindow;
    my $feedlink = '';
    if ($self->{'rss_feed_url'}) {
	my $url = $self->{'rss_feed_url'};
	my $title = $self->{'rss_feed_title'};
	$feedlink = qq|<link rel="alternate" type="application/rss+xml" title="$title" href="$url">|;
    }
    $feedlink .= qq|<link rel="alternate" type="application/rss+xml" title="Kalliope - Seneste nyheder" href="news-feed.cgi">|;
    print CGI::header(-type => 'text/html; charset=ISO-8859-1',
# -expires => '+4h',
		      -cookie => $self->{'cookies'});
    if ($self->{'redirect'}) {
	my $url = $self->{'redirect'};
	print qq|<html><head><meta http-equiv="refresh" content="0; URL=$url"></head></html>|;
	return;
    }
    
    print '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">';
    print <<"EOF";
<HTML><HEAD><TITLE>$titleForWindow</TITLE>
<LINK REL="Shortcut Icon" HREF="http://www.kalliope.org/favicon.ico">
<link rel="apple-touch-icon" href="http://www.kalliope.org/gfx/icons/iphone-icon.png">
<link rel="search" type="application/opensearchdescription+xml" title="Kalliope" href="http://www.kalliope.org/opensearch.xml">
<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">
<META HTTP-EQUIV="Content-Type" content="text/html; charset=iso-8859-1">
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, e-text, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
$feedlink
<script type="text/javascript" src="script/jquery-1.7.min.js"></script>
<SCRIPT TYPE="text/javascript">
function openTimeContext(year) {
     window.open('timecontext.cgi?center='+year,'Timecontext','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=400,height=300');
     return false;
}
</SCRIPT>
EOF
    my $user = fetch Kalliope::User;
    if ($user) {
	print qq|
	    <script type="text/javascript" src="http://jqueryui.com/latest/ui/ui.core.js"></script>
<script type="text/javascript" src="http://jqueryui.com/latest/ui/ui.draggable.js"></script>
<script type="text/javascript" src="http://jqueryui.com/latest/ui/ui.resizable.js"></script>
<script type="text/javascript" src="http://jqueryui.com/latest/ui/ui.dialog.js"></script>
<link type="text/css" href="http://jqueryui.com/latest/themes/base/ui.all.css" rel="stylesheet"/>
	    |;
    }
    print qq|
</HEAD>
<!--<BODY LINK="#000000" VLINK="#000000" ALINK="#000000" LEFTMARGIN=0 TOPMARGIN=0 MARGINHEIGHT=0 MARGINWIDTH=0>-->
<BODY LINK="#000000" VLINK="#000000" ALINK="#000000">|;
 
    print '<center><br>';

    if (0) {
    print <<"GOOGLEADS";
    <script type="text/javascript"><!--
    google_ad_client = "pub-3823256275585089";
    //468x60, created 11/12/07
    google_ad_slot = "7400134560";
    google_ad_width = 468;
    google_ad_height = 60;
    //--></script>
    <script type="text/javascript"
    src="http://pagead2.googlesyndication.com/pagead/show_ads.js">
    </script>
GOOGLEADS
    };
    
    print '<div class="body">';
    print '<div class="site">';
    print '<div class="layout">';
    if (my $crumbs = $self->_constructBreadcrumbs) {
        print '<div class="breadcrumbs">';
	    print $crumbs;
	    print '</div>';
    }

    # Head BACKGROUND="gfx/frames/top.png"
    print '<div class="topsection">';
    print '<img style="float:left" alt="#" src="'.$self->pageIcon.'" height="164" width="139">';

#    print '<TABLE WIDTH="100%" BORDER="0" CELLSPACING="0" CELLPADDING="0"><TR>';
#    print '<TD ROWSPAN="3" valign="top"><IMG alt="#" SRC="'.$self->pageIcon.'" HEIGHT="164" WIDTH="139"></TD>';
#    print '<TD colspan="5" HEIGHT="32" WIDTH="100%" CLASS="top"><img alt="#" src="gfx/trans1x1.gif" height="72" width="1"></TD>';
#    print '</tr>';
#    
    if (!$self->{'nosubmenu'}) {
        print '<div class="submenu">';
	    print $self->_navigationSub;
	    print '</div> <!-- submenu -->';
    }

    print '<div class="maintitle">';
    print $self->titleAsHTML;
    print '</div> <!-- maintitle -->';
    
    print '</div> <!-- top section -->';

    # Body
    print '<div class="middlesection">';
    print '<div class="navigation"><div>';
    print $self->_navigationMain;
    print '</div></div> <!-- navigation -->';
    print '<div class="paper">';
    print '<div class="columnholder">';
    my @widths = $self->getColoumnWidths;
    my $count = 0;
    foreach my $colHTML (@{$self->{'coloumns'}}) {
        $colHTML = $colHTML || '';
        my $width = shift @widths;
        print '<div class="column" style="width:'.$width.'%">';
        print '<div class="column-content">';
        print $colHTML;
        print '</div> <!-- column-content -->';
        print '</div> <!-- column -->';
	    #my $style = ++$count == 3 ? qq|style="width: 250px; border-left: 3px dotted #808080"| : '';
        #my $width = shift @widths;
	    #if ($width) {
	    #    print qq|<TD VALIGN="top" $style WIDTH="$width">$colHTML</TD>\n|;
        #} else {
	    #    print qq|<TD $style VALIGN="top">$colHTML</TD>\n|;
        #}
    }
    print '<div class="clear"></div>';
    print '</div> <!-- columnholder -->';
    print '<div class="clear"></div>';
    print '</div> <!-- paper -->';
    print '<div class="clear"></div>';
    print '</div> <!-- middlesection -->';
    print '<div class="clear"></div>';

    # Foot
    print '<div class="footer">';
    print '<div class="searchbox">';
    print '<FORM METHOD="get" ACTION="ksearch.cgi">';
    print '<INPUT CLASS="search" NAME="needle" placeholder="Søg i Kalliope"><INPUT TYPE="hidden" NAME="sprog" VALUE="'.$self->lang.'"><INPUT TYPE="hidden" NAME="type" VALUE="free">';
    print '</form>';
    print '</div> <!-- searchbox -->';
    print '<div class="flags">';
    print $self->langSelector;
    print '</div> <!-- flags -->';
    print '<div class="clear"></div>';
    print '</div> <!-- footer -->';
    
    print '</div> <!-- layout -->'; 
    print '</div> <!-- site -->'; 
    print '</div> <!-- body -->';
    print '</center>';
    
    # Google analytics
    print q|
    <script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
try {
var pageTracker = _gat._getTracker("UA-8418639-1");
pageTracker._trackPageview();
} catch(err) {}</script>|;
    if ($user || $self->{'setremoteuser'}) {
	print '<div style="padding:5px 5px 0 0;text-align:right"><a style="color:#808080;font-size:0.5em" href="login.cgi?action=logout">Log ud</a></div>';
    } else {
	print '<div style="padding:5px 5px 0 0;text-align:right"><a style="color:#a0a0a0;font-size:0.5em" href="login.cgi">&pi;</a></div>';
    }
    print '</body></html>';
}

#
# Private ------------------------------------------------------
#

sub langSelector {
    my $self = shift;
    my $selfLang = $self->lang; 
    my $HTML;
    my %titles = ( dk => 'danske',
                   uk => 'britiske',
                   us => 'amerikanske',
		   de => 'tyske',
		   fr => 'franske',
		   it => 'italienske',
		   se => 'svenske',
		   no => 'norske' );
    my $url = $self->{'changelangurl'};
    foreach my $lang ('dk','uk','de','fr','se','no','it','us') {
       my $refURL = $url;
       $refURL =~ s/sprog=../sprog=$lang/;
       my $img = $lang eq $selfLang ? "${lang}select.gif" : "$lang.gif";
       my $alt = $lang eq $selfLang ? 'Du befinder dig i den '.$titles{$lang}.' samling.' : 'Skift til den '.$titles{$lang}.' samling.';
       $HTML .= qq|<A TITLE="$alt" HREF="$refURL"><IMG ALT="$alt" BORDER=0 SRC="gfx/flags/$img"></A>|;
#       $HTML .= '<BR>' if $lang eq 'de';
    }
    return $HTML;
}

sub menuStructs {
    my $self = shift;
    my $lang = $self->lang;

    my %menuStructs = (
         'welcome' => {'menuTitle' => '',
                       'url' => 'index.cgi',
                       'pages' => ['news']
                       },
         'om'       => {'menuTitle' => '',
                        'url' => 'index.cgi',
                       'pages' => ['about','tak','musen']
 	               },
         'poets'    => {menuTitle => 'Digtere',
                       url => 'poetsfront.cgi?sprog='.$lang,
		       icon => 'gfx/frames/menu-digtere.gif',
                       'pages' => ['poetsbyname','poetsbyyear','poetsbypic',
		                   'poetsbyflittige','poetsbypop']
                       },
         'worklist' => {menuTitle => 'Værker',
                       url => "worksfront.cgi?sprog=$lang",
		       icon => 'gfx/frames/menu-vaerker.gif',
                       pages => ['kvaerkertitel','kvaerkeraar','kvaerkerdigter',
                                 'kvaerkerpop']
                       },
         'poemlist' => {menuTitle => 'Digte',
		       icon => 'gfx/frames/menu-digte.gif',
                       url => "poemsfront.cgi?sprog=$lang",
                       pages => ['poemtitles','poem1stlines','poempopular','latest']
                       },
         'history' => {menuTitle => 'Baggrund',
		       icon => 'gfx/frames/menu-meta.gif',
                       url => 'metafront.cgi?sprog='.$lang,
                       pages => ['keywordtoc','dict','persons']
                       },
#         'forum' =>    {menuTitle => 'Forum',
#                       url => 'forumindex.cgi',
#		       icon => 'gfx/icons/forum-w64.gif',
#                       pages => ['forumindex']
#                       },
         'forumindex' => {menuTitle => 'Oversigt',
                       url => 'forumindex.cgi'
                       },
         'poemtitles' =>{menuTitle => 'Digttitler',
                       url => 'klines.pl?mode=1&forbogstav=A&sprog='.$lang
                       },
         'poem1stlines' => {menuTitle => 'Førstelinier',
                       url => 'klines.pl?mode=0&forbogstav=A&sprog='.$lang
                       },
         'poempopular' => {menuTitle => 'Populære',
                       url => 'klines.pl?mode=2&sprog='.$lang
                       },
         'news' =>     {menuTitle => 'Nyheder',
                       url => 'index.cgi'
                       },
         'about' =>    {menuTitle => 'Om',
                       url => 'kabout.pl?page=about'
                       },
         'tak' =>      {menuTitle => 'Tak',
                       url => 'kabout.pl?page=tak'
                       },
         'musen' =>     {menuTitle => 'Musen',
                       url => 'kabout.pl?page=musen'
                       },
         'stats' =>    {menuTitle => 'Statistik',
                       url => 'kstats.pl'
                       },
         'latest' =>    {menuTitle => 'Tilføjelser',
                         url => 'latest.cgi'
                       },
         'poetsbyname' => {menuTitle => 'Digtere efter navn',
                           url => 'poets.cgi?list=az&sprog='.$lang
                       },
         'poetsbyyear' => {menuTitle => 'Digtere efter år',
                           url => 'poets.cgi?list=19&sprog='.$lang
                       },
         'poetsbypic' => {menuTitle => 'Digtere efter udseende',
                           url => 'poets.cgi?list=pics&sprog='.$lang
                       },
         'poetsbyflittige' => {menuTitle => 'Flittigste digtere',
                           url => 'poets.cgi?list=flittige&sprog='.$lang
                       },
         'poetsbypop'    => {menuTitle => 'Mest populære digtere',
                             url => 'poets.cgi?list=pop&sprog='.$lang
                       },
         'kvaerkertitel' => {menuTitle => 'Værker efter titel',
                           url => 'kvaerker.pl?mode=titel&sprog='.$lang
                       },
         'kvaerkerdigter' => {menuTitle => 'Værker efter digter',
                           url => 'kvaerker.pl?mode=digter&sprog='.$lang
                       },
         'kvaerkeraar' => {menuTitle => 'Værker efter år',
                           url => 'kvaerker.pl?mode=aar&sprog='.$lang
                       },
         'kvaerkerpop' => {menuTitle => 'Mest populære værker',
                           url => 'kvaerker.pl?mode=pop&sprog='.$lang
                       },
         'keywordtoc' => {menuTitle => 'Nøgleord',
                           url => 'keywordtoc.cgi?sprog='.$lang
                       },
         'dict' => {menuTitle => 'Ordbog',
                           url => 'dict.cgi'
                       },
         'persons' => {menuTitle => 'Biografier',
                           url => 'persons.cgi?list=az',
                       'pages' => ['personsbyname','personsbyyear','personsbypic']
                       },
         'personsbyname' => {menuTitle => 'Personer efter navn',
                           url => 'persons.cgi?list=az&sprog='.$lang
                       },
         'personsbyyear' => {menuTitle => 'Personer efter år',
                           url => 'persons.cgi?list=19&sprog='.$lang
                       },
         'personsbypic' => {menuTitle => 'Personer efter udseende',
                           url => 'persons.cgi?list=pics&sprog='.$lang
                       },
         'timeline' => {menuTitle => 'Tidslinie',
                           url => 'timeline.cgi&sprog='.$lang
                       }
          );

    # Special topmenu for forum
    if ($self->{'pagegroup'} eq 'forum') {
	my $antalFora = Kalliope::Forum::getNumberOfForas;
	my @temp;
	foreach my $i (0..$antalFora-1) {
	    my $forum = new Kalliope::Forum($i);
	    $menuStructs{"forum$i"} = { menuTitle => $forum->getTitle,
		                        url => 'forum.cgi?forumid='.$i };
		push @temp,"forum$i";
	}
	$menuStructs{'forum'}->{'pages'} = \@temp;
    }
    
    return %menuStructs;
}

sub _navigationMain {
    my $self = shift;
    my @topMenuItems = ('welcome','poets','worklist','poemlist', 'history','forum');
    my %menuStructs = $self->menuStructs;
    my $HTML = '<BR>';

    # Pagegroups
    foreach my $key (@topMenuItems) {
        my $struct = $menuStructs{$key};
        my ($title,$url,$icon) = ($struct->{'menuTitle'},
                                  $struct->{'url'},$struct->{'icon'});
	next unless $icon;			  
	$HTML .= qq|<A TITLE="$title" HREF="$url">|;
	$HTML .= qq|<IMG ALT="$title" BORDER=0 SRC="$icon">|;
        if ($key ne $self->{'pagegroup'} && $key ne $self->{'pagegroupchoosen'}) {
#	    $HTML .= $title;
	} else {
#            $HTML .= "<B>$title</B>";
	}
	$HTML .= '</A><br>';
    }
    return $HTML;
}

sub _navigationSub {
    my $self = shift;
    my %menuStructs = $self->menuStructs;
    my $HTML;
    my @itemsHTML;
    
    # Pages
    my $struct = $menuStructs{$self->{'pagegroup'}};
    foreach my $key (@{$struct->{'pages'}}) {
        my $struct = $menuStructs{$key};
        my ($title,$url) = ($struct->{'menuTitle'},
                           $struct->{'url'});
        if ($key ne $self->{'page'}) {
	    push @itemsHTML, qq|<A CLASS="submenu" HREF="$url">$title</A>|;
	} else {
            push @itemsHTML, qq|<A CLASS="submenu" HREF="$url"><B>$title</B></A>|;
	}
    }
    $HTML = join ' <span class="lifespan">&bull;</span> ',@itemsHTML;
    #$HTML = join ' <span class="lifespan">&#149;</span> ',@itemsHTML;
    # Author menu
    if ($self->{'poet'}) {
       $HTML .= $self->{'poet'}->menu($self);
    }
    return $HTML;
}

sub notFound {
    my $message = shift;
    $message = $message || qq|Hovsa! Der gik det galt! Siden kunne ikke findes.<BR><BR>Send en mail til <A HREF="mailto:jesper\@kalliope.org">jesper\@kalliope.org</A>, hvis du mener, at jeg har lavet en fejl.|;
    my $HTML;
    my $picNo = int rand(10) + 1;
    my $page = new Kalliope::Page ('title' => 'Hovsa!', nosubmenu => 1);
    $page->addBox(content => qq|<CENTER><IMG BORDER=2 SRC="gfx/notfound/$picNo.jpg" ALIGN="center"></CENTER><BR><BR>$message|);
    $page->print;
    exit;
}

1;
