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

    # Default values
    $self->{'pagegroupchoosen'} = '';
    $self->{'coloumnwidths'} = [];
    $self->{'columnrule'} = 0;
    $self->{'cssClass'} = '';

    # Override defaults
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
        my $cookie = new CGI::Cookie(
            -expires => '+3M',
  	        -name => 'user',
	        -value => $self->{'setremoteuser'});
    	$self->{'cookies'} = [$cookie];
    }
    if ($self->{'removeremoteuser'}) {
        my $cookie = new CGI::Cookie(
            -expires => '-1M',
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
                                  columrule => $args{'columnrule'},
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
    my $result = "<h1>$title</h1>";
    $result .= qq|<h2>$subtitle</h2>| if $subtitle;
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
          push @blocks,qq|<a href="$$item[1]">$$item[0]</a>|;
       } else {
          push @blocks,qq|<span>$$item[0]</span>|;
       }
    }
    return join ' >> ',@blocks;
}

sub addBox {
    my ($self,%args) = @_;
    my $align =  $args{'align'} || 'left';
    my $theme = $args{'theme'} || 'normal';
    my $cssClass = $args{'cssClass'} || '';
    my $HTML = '';
    $HTML .= qq|<div class="box$theme $cssClass" style="text-align: $align">|;
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
    my $i = 0;
    foreach my $str (@activeItems) {
	    my %item = %{$str};
	    my $url = $item{url};
	    if ($item{status}) {
	        my $HTML = '<div class="frontmenu-item">';
	        if ($item{unclickable}) {
    	        $HTML .= qq|<div class="icon"><img width="48" border="0" src="$item{icon}" alt="$item{title}"></div>|;
    	        $HTML .= qq|<div class="title">$item{title}</div>|;
    	        $HTML .= qq|<div class="descr">$item{desc}</div>|;
	        } else {
    	        $HTML .= qq|<div class="icon"><a href="$url"><img width="48" border="0" src="$item{icon}" alt="$item{title}"></a></div>|;
    	        $HTML .= qq|<div class="title"><a href="$url">$item{title}</a></div>|;
    	        $HTML .= qq|<div class="descr"><a href="$url">$item{desc}</a></div>|;
	        }
	        $HTML .= qq|<div class="clear"></div>|;
	        $HTML .= '</div> <!-- frontmenu-item -->';
	        $self->addBox(coloumn => $i++ < $splitAt ? 0 : 1,
	                      content => $HTML);
        }
    }
}


sub addDoubleColumn {
    my ($self,@blocks) = @_;
    my $HTML;
    my $total;
    my $subtotal = 0;
    my $i;
    
    $self->setColoumnWidths(50,50);

    map { $_->{'count'} += 3 } @blocks;
    map { $total += $_->{'count'} } grep {$_->{'count'}} @blocks;

    my ($left,$right) = (0,0);
    my $minI;
    my $minDiff = $total;
    for ($i = 0; $i <= $#blocks; $i++) {
	    $right = $total - $left;
	    if (abs ($right-$left) <= $minDiff ) {
            $minDiff = abs ($right-$left);
	        $minI = $i;
	    }
        $left += $blocks[$i]->{'count'};
    }
    
    $i = 0;
    foreach $b (@blocks) {
        next unless ($b->{'count'});
	    if ($i == $minI && $total > 8) {
	        $self->addBox(coloumn => 0,
	                      content => $HTML);
	        $HTML = '';
	    }
        $subtotal += $b->{'count'};
	    $HTML .= $b->{'head'} || '';
	    $HTML .= ($b->{'body'} || '')."<BR>\n";
	    $i++;
    }
    $self->addBox(coloumn => 1,
                  content => $HTML);
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
<HTML class="kalliope"><HEAD><TITLE>$titleForWindow</TITLE>
<LINK REL="Shortcut Icon" HREF="http://www.kalliope.org/favicon.ico">
<link rel="apple-touch-icon" href="http://www.kalliope.org/gfx/icons/iphone-icon.png">
<meta name="viewport" content="width=device-width; initial-scale=1.0" />
<link rel="search" type="application/opensearchdescription+xml" title="Kalliope" href="http://www.kalliope.org/opensearch.xml">
<link rel="stylesheet type="text/css" href="kalliope.css">
<!-- <link rel="stylesheet" type="text/css" media="handheld, only screen and (max-device-width: 400px)" href="mobile.css">-->
<META HTTP-EQUIV="Content-Type" content="text/html; charset=iso-8859-1">
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, e-text, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
$feedlink
<script type="text/javascript" src="script/jquery-1.7.min.js"></script>
<link href='http://fonts.googleapis.com/css?family=PT+Serif:400,700,400italic|PT+Sans:400italic,400,700' rel='stylesheet' type='text/css'>

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
 
    print '<center>';

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

    print '<div class="topsection">';
    print '<img style="float:left" alt="#" src="'.$self->pageIcon.'" height="164" width="139">';

    if (!$self->{'nosubmenu'}) {
        print '<div class="submenu">';
	    print $self->_navigationSub;
	    print '</div> <!-- submenu -->';
    }

    print '</div> <!-- top section -->';

    # Body
    print '<div class="middlesection">';
    print '<div class="navigation">';
    print $self->_navigationMain;
    print '</div> <!-- navigation -->';
    print '<div class="paper">';
    print '<div class="maintitle">';
    print $self->titleAsHTML;
    print '<div class="clear"></div>';
    print '</div> <!-- maintitle -->';
    

    print '<div class="paper-content">';

    print '<div class="columnholder">';
    my @widths = $self->getColoumnWidths;
    foreach my $colHTML (@{$self->{'coloumns'}}) {
        $colHTML = $colHTML || '';
        my $width = shift @widths;
        my $columnrule = '';
        if ($self->{'columnrule'} && $#widths == -1) {
            $columnrule = 'columnrule';
        }
        print "<div class='column column$width'>";
        print "<div class='column-content $columnrule'>";
        print $colHTML;
        print '</div> <!-- column-content -->';
        print '</div> <!-- column -->';
    }
    print '<div class="clear"></div>';
    print '</div> <!-- columnholder -->';
    print '<div class="clear"></div>';
    print '</div> <!-- paper-content -->';
    print '</div> <!-- paper -->';
    print '<div class="clear"></div>';
    print '</div> <!-- middlesection -->';
    print '<div class="clear"></div>';

    # Foot
    print '<div class="footer">';
    print '<div class="searchbox">';
    print '<form method="get" action="ksearch.cgi">';
    print '<input class="search" name="needle" placeholder="Søg i Kalliope">';
    print '<input type="hidden" name="sprog" value="'.$self->lang.'">';
    print '<input type="hidden" name="type" value="free">';
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
#    if ($user || $self->{'setremoteuser'}) {
#	    print '<div style="padding:5px 5px 0 0;text-align:right"><a style="color:#808080;font-size:0.5em" href="login.cgi?action=logout">Log ud</a></div>';
#    } else {
#	    print '<div style="padding:5px 5px 0 0;text-align:right"><a style="color:#a0a0a0;font-size:0.5em" href="login.cgi">&pi;</a></div>';
#    }
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
       my $cssClass = $lang eq $selfLang ? 'selectedflag' : ';';
       my $img16 = "gfx/flags/16/$lang.png";
       my $img32 = "gfx/flags/32/$lang.png";
       my $alt = $lang eq $selfLang ? 'Du befinder dig i den '.$titles{$lang}.' samling.' : 'Skift til den '.$titles{$lang}.' samling.';

       $HTML .= qq|<a class="$cssClass" title="$alt" href="$refURL">|;
       $HTML .= qq|<img class="hidescreen" width="16" alt="$alt" border="0" src="$img32">|;
       $HTML .= qq|<img class="hidemobile" width="16" alt="$alt" border="0" src="$img16">|;
       $HTML .= qq|</a>|;
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
    my $lang = $self->lang;
    
    my @menuItems = ({
            title => 'Kalliope',
            klass => 'forside',
            url => "index.cgi?lang=$lang",
            caption => 'Tilbage til forsiden',
            icon => 'gfx/icons/poet-w96.png'
        },{
            title => 'Digtere',
            url => "poetsfront.cgi?sprog=$lang",
            caption => 'Digtere',
            icon => 'gfx/icons/poet-w96.png'
        },{
            title => 'Værker',
            url => "worksfront.cgi?sprog=$lang",
            caption => 'Værker',
            icon => 'gfx/icons/works-w96.png'
        },{
            title => 'Digte',
            url => "poemsfront.cgi?sprog=$lang",
            caption => 'Digte',
            icon => 'gfx/icons/poem-w96.png'
        },{
            title => 'Baggrund',
            url => "metafront.cgi?sprog=$lang",
            caption => 'Om Kalliope og andet baggrundsmateriale',
            icon => 'gfx/icons/keywords-w96.png'
        });

    my $HTML = '<div class="mainmenu"><ul>';
    foreach my $item (@menuItems) {
        my ($title,$url,$icon,$caption,$class) = ($item->{'title'},
                                  $item->{'url'}, $item->{'icon'}, 
                                  $item->{'caption'}, $item->{'klass'});
        $class = $class || '';                         
        $HTML .= qq|<li class="$class">|;
	    $HTML .= qq|<a title="$caption" href="$url"><img title="$caption" src="$icon"></a>|;
	    $HTML .= qq|<p><a title="$caption" href="$url">$title</a></p>|;
	    $HTML .= '</li>';
    }
    $HTML .= '<ul></div> <!-- mainmenu -->';
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
