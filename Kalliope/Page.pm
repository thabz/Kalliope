#  Copyright (C) 1999-2001 Jesper Christensen 
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
use CGI::Cookie ();
use strict;

sub new {
    my ($class,%args) = @_;
    my $self = bless {}, $class;
    foreach my $key (%args) {
        $self->{$key} = $args{$key};
    }
    $self->{'lang'} = $args{'lang'} || 'dk';
    $self->{'pagegroup'} = $args{'pagegroup'};
    $self->{'page'} = $args{'page'};
    $self->{'thumb'} = $args{'thumb'};
    $self->{'title'} = $args{'title'};
    $self->{'columns'} = [];

    if ($self->{'setcookies'}) {
        $self->_setCookies(%{$self->{'setcookies'}});
    }

    if ($args{'changelangurl'}) {
        $self->{'changelangurl'} = $args{'changelangurl'};
    } elsif ($self->{'poet'}) {
	$self->{'changelangurl'} = 'poets.cgi?list=az&sprog=XX';
    } else {
	$ENV{REQUEST_URI} =~ /([^\/]*)$/;
	$self->{'changelangurl'} = $1;
    }
    return $self;
}

sub _setCookies {
    my ($self,%vals) = @_;
    my @cookies;

    foreach my $name (keys %vals) {
        my $cookie = new CGI::Cookie(-expires => '+3M',
	                             -name => $name,
	                             -value => $vals{$name});
	push @cookies,$cookie;			     
    }
    $self->{'cookies'} = \@cookies;
    return @cookies;
}

sub _printCookies {
    my $self = shift;
    my $output;
    return unless $self->{'cookies'};
    foreach my $cookie (@{$self->{'cookies'}}) {
        $output .= "Set-Cookie: $cookie\n";
    }
    return $output;
}

sub newAuthor {
    my ($class,%args) = @_;
    my $poet = $args{'poet'};
    my $page = new Kalliope::Page(title => $poet->name,
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
    my ($src,$alt,$href);
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

sub titleAsHTML {
    my $self = shift;
    my $title;
    if ($self->{'poet'}) {
        $title = $self->{'poet'}->name;
        $title .= '<SPAN CLASS="lifespan"> '.$self->{'poet'}->lifespan.'</SPAN>';
    } else {
        $title = $self->{'title'};
    }
    return $title;
}

sub titleForWindow {
    my $self = shift;
    return $self->{'frontpage'} ? 'Kalliope' : $self->{'title'}.' - Kalliope';
}

sub setColoumnWidths {
    my ($self,@widths) = @_;
    $self->{'coloumnwidths'} = \@widths;
}

sub getColoumnWidths {
    my $self = shift; 
    if ($self->{'poet'} && !$self->{'coloumnwidths'}) {
        return ('100','100%','100');
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
    my $HTML = join ' >> ',@blocks;
    $HTML = qq|<SPAN STYLE="font-family:Arial,Helvetica; font-size: 10px">$HTML</SPAN>|;
    return $HTML;
}

sub addBox {
    my ($self,%args) = @_;

    my $bggfx = (defined $args{'theme'} && $args{'theme'} eq 'dark') ? 'pap.gif' : 'lightpap.gif';
    $bggfx = 'notepap.jpg' if defined $args{'theme'} && $args{'theme'} eq 'note';

    my $HTML;
    $HTML .= '<TABLE WIDTH="'.$args{width}.'" ALIGN="center" BORDER=0 CELLPADDING=1 CELLSPACING=0><TR><TD ALIGN=right>';
    if ($args{title}) {
	$HTML .= '<DIV STYLE="position: relative; top: 16px; left: -10px;">';
	$HTML .= '<TABLE BORDER=0 CELLPADDING=1 CELLSPACING=0><TR><TD BGCOLOR=black>';
	$HTML .= '<TABLE STYLE="border-top: 1px solid #F8FAF2; border-left: 1px solid #F8F4F2; border-bottom: 1px solid #81807E; border-right: 1px solid #81807E" ALIGN=center WIDTH="100%" CELLSPACING=0 CELLPADDING=2 BORDER=0><TR><TD CLASS="boxheaderlayer" BACKGROUND="gfx/pap.gif" >';
	$HTML .= $args{title};
	$HTML .= "</TD></TR></TABLE>";
	$HTML .= "</TD></TR></TABLE>";
	$HTML .= '</DIV>';
    }
    $HTML .= '</TD></TR><TR><TD VALIGN=top BGCOLOR=black>';
    $HTML .= '<TABLE STYLE="border-top: 1px solid #F8FAF2; border-left: 1px solid #F8F4F2; border-bottom: 1px solid #81807E; border-right: 1px solid #81807E" WIDTH="100%" ALIGN=center CELLSPACING=0 CELLPADDING=15 BORDER=0>';
    $HTML .= '<TR><TD '.($args{align} ? qq|ALIGN="$args{align}"| : '').qq| BACKGROUND="gfx/$bggfx">|;
    $HTML .= $args{content};
    if ($args{end}) {
	$HTML .= "</TD></TR></TABLE>";
	$HTML .= "</TD></TR><TR><TD>";
	$HTML .= '<DIV STYLE="position: relative; top: -10px; left: 10px;">';
	$HTML .= '<TABLE BORDER=0 CELLPADDING=1 CELLSPACING=0><TR><TD BGCOLOR=black>';
	$HTML .= '<TABLE STYLE="border-top: 1px solid #F8FAF2; border-left: 1px solid #F8F4F2; border-bottom: 1px solid #81807E; border-right: 1px solid #81807E" WIDTH="100%" CELLSPACING=0 CELLPADDING=2 BORDER=0><TR><TD CLASS="boxheaderlayer" BACKGROUND="gfx/pap.gif" >';
	$HTML .= $args{end};
	$HTML .= "</TD></TR></TABLE>";
	$HTML .= "</TD></TR></TABLE>";
	$HTML .= '</DIV>';
	$HTML .= '</TD></TR></TABLE>';
    } else {
	$HTML .= "</TD></TR></TABLE>";
	$HTML .= "</TD></TR></TABLE>";
    }
    $self->addHTML($HTML, %args);
}

sub print {
    my $self = shift;
    my $titleForWindow = $self->titleForWindow;
    print $self->_printCookies;
    print "Content-type: text/html\n\n";
    print '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">';
    print <<"EOF";
<HTML><HEAD><TITLE>$titleForWindow</TITLE>
<LINK REL=STYLESHEET TYPE="text/css" HREF="kalliope.css">
<META HTTP-EQUIV="Content-Type" content="text/html; charset=iso-8859-1">
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, e-text, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
<SCRIPT>
function openTimeContext(year) {
     window.open('timecontext.cgi?center='+year,'Timecontext','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=400,height=300');
     return false;
}
</SCRIPT>
</HEAD>
<BODY LINK="#000000" VLINK="#000000" ALINK="#000000" LEFTMARGIN=0 TOPMARGIN=0 MARGINHEIGHT=0 MARGINWIDTH=0>

EOF
 
    print '<TABLE HEIGHT="100%" WIDTH="100%" BORDER=0 CELLSPACING=0 CELLPADDING=0>';
    
    if (my $crumbs = $self->_constructBreadcrumbs) {
        print '<TR><TD COLSPAN=3>';
	print '<DIV STYLE="background-color: #e0e0e0; padding: 1px">';
	print $crumbs;
	print '</DIV>';
	print '</TD></TR>';
    }

    # Head
    print '<TR><TD HEIGHT=70 COLSPAN=3 VALIGN="top">';

    print '<TABLE BGCOLOR="black" WIDTH="100%" BORDER=0 CELLSPACING=0 CELLPADDING=0><TR>';
    print '<TD ROWSPAN=2><IMG SRC="gfx/trans1x1.gif" HEIGHT=70 WIDTH=1></TD>';
    print '<TD WIDTH="100%" CLASS="maintitle">'.$self->titleAsHTML.'</TD>';
    print '<TD ROWSPAN=2 VALIGN="top">'.$self->thumbIMG.'</TD></TR>';
#    print '</TR>';
    print '<TR><TD ALIGN="right" CLASS="navigation">'.$self->_navigationSub.'</TD>';
    print '</TR></TABLE>';
    print '</TD></TR>';

    # Body
    print '<TR>';
    print '<TD BACKGROUND="gfx/sidebar.jpg" CLASS="navigation" WIDTH="100" VALIGN="top" ALIGN="center">'.$self->_navigationMain.'<BR><BR>';

    print '</TD><TD VALIGN="top">';
    print '<TABLE WIDTH="100%" HEIGHT="100%"><TR>';
    my @widths = $self->getColoumnWidths;
    foreach my $colHTML (@{$self->{'coloumns'}}) {
	if (my $width = shift @widths) {
	    print qq|<TD VALIGN="top" WIDTH="$width">$colHTML</TD>\n|;
        } else {
	    print qq|<TD VALIGN="top">$colHTML</TD>\n|;
        }
    }
    print '</TR></TABLE>';
    print '</TD>';

    print '<TD BGCOLOR="black">';
    print '<IMG SRC="gfx/trans1x1.gif" WIDTH=0>';
    print '</TD>';
    print '</TR>';

    # Foot
    print '<TR><TD COLSPAN=3 HEIGHT="40" BGCOLOR="black" ALIGN="right" VALIGN="middle">';

    print '<TABLE><TR><TD VALIGN="middle" ALIGN="right">';
    print '<FORM METHOD="get" ACTION="ksearch.cgi"><INPUT STYLE="width: 80px" NAME="needle"> <INPUT CLASS="button" TYPE="submit" VALUE=" Søg "><BR><INPUT TYPE="hidden" NAME="sprog" VALUE="'.$self->lang.'"><INPUT TYPE="hidden" NAME="type" VALUE="free"></FORM>';
    print '</TD><TD VALIGN="middle" ALIGN="right">';
    print $self->langSelector;
    print '</TD></TR></TABLE>';

    print '</TD></TR>';
    
    print '</TABLE></BODY></HTML>';
}

#
# Private ------------------------------------------------------
#

sub langSelector {
    my $self = shift;
    my $selfLang = $self->lang; 
    my $HTML;
    my %titles = ( dk => 'danske',
                   uk => 'engelske',
                   us => 'amerikanske',
		   de => 'tyske',
		   fr => 'franske',
		   se => 'svenske',
		   no => 'norske' );
    my $url = $self->{'changelangurl'};
    foreach my $lang ('dk','uk','de','fr','se','no','us') {
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
         'welcome' => {'menuTitle' => 'Velkommen',
                       'url' => 'index.cgi',
                       'pages' => ['news','about','tak','musen','stats']
                       },
         'poets'    => {menuTitle => 'Digtere',
                       url => 'poets.cgi?list=az&sprog='.$lang,
		       icon => 'gfx/icons/poet-w64.gif',
                       'pages' => ['poetsbyname','poetsbyyear','poetsbypic',
		                   'poetsbyflittige','poetsbypop']
                       },
         'worklist' => {menuTitle => 'Værker',
                       url => 'kvaerker.pl?sprog='.$lang,
		       icon => 'gfx/icons/works-w64.gif',
                       pages => ['kvaerkertitel','kvaerkeraar','kvaerkerdigter',
                                 'kvaerkerpop']
                       },
         'poemlist' => {menuTitle => 'Digte',
		       icon => 'gfx/icons/poem-w64.gif',
                       url =>'klines.pl?mode=1&forbogstav=A&sprog='.$lang,
                       pages => ['poemtitles','poem1stlines','poempopular','latest']
                       },
         'history' => {menuTitle => 'Nøgleord',
                       url => 'keywordtoc.cgi?sprog='.$lang,
                       pages => ['keywordtoc','timeline','keyword']
                       },
         'forum' =>    {menuTitle => 'Forum',
                       url => 'forumindex.cgi',
		       icon => 'gfx/icons/forum-w64.gif',
                       pages => ['forumindex']
                       },
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
         'keywordtoc' => {menuTitle => 'Indhold',
                           url => 'keywordtoc.cgi?sprog='.$lang
                       },
         'timeline' => {menuTitle => 'Tidslinie',
                           url => 'timeline.cgi&sprog='.$lang
                       }
          );
    return %menuStructs;
}

sub _navigationMain {
    my $self = shift;
    my @topMenuItems = ('welcome','poets','worklist','poemlist', 'history','forum');
    my %menuStructs = $self->menuStructs;
    my $HTML;

    # Pagegroups
    foreach my $key (@topMenuItems) {
        my $struct = $menuStructs{$key};
        my ($title,$url,$icon) = ($struct->{'menuTitle'},
                                  $struct->{'url'},$struct->{'icon'});
	$HTML .= qq|<A CLASS=white  HREF="$url">|;
	$HTML .= qq|<IMG BORDER=0 SRC="$icon"><BR>|;
        if ($key ne $self->{'pagegroup'}) {
	    $HTML .= $title;
	} else {
            $HTML .= "<B>$title</B>";
	}
	$HTML .= '</A><BR><BR>';
    }
    return $HTML;
}

sub _navigationSub {
    my $self = shift;
    my %menuStructs = $self->menuStructs;
    my $HTML;
    
    # Pages
    my $struct = $menuStructs{$self->{'pagegroup'}};
    foreach my $key (@{$struct->{'pages'}}) {
        my $struct = $menuStructs{$key};
        my ($title,$url) = ($struct->{'menuTitle'},
                           $struct->{'url'});
        if ($key ne $self->{'page'}) {
	    $HTML .= qq|<A CLASS=white HREF="$url">[$title]</A> |;
	} else {
            $HTML .= qq|<B>[$title]</B> |;
	}
    }
    # Author menu
    if ($self->{'poet'}) {
       $HTML .= $self->{'poet'}->menu;
    }
    return $HTML;
}

sub notFound {
    my $message = shift;
    $message = $message || qq|Hovsa! Der gik det galt! Siden kunne ikke findes.<BR><BR>Send en mail til <A HREF="mailto:jesper\@kalliope.org">jesper\@kalliope.org</A> hvis du mener at jeg har lavet en fejl.|;
    my $HTML;
    my $picNo = int rand(10) + 1;
    my $page = new Kalliope::Page ('title' => 'Hovsa!');
    $page->addBox(content => qq|<IMG BORDER=2 SRC="gfx/notfound/$picNo.jpg" ALIGN="center"><BR><BR>$message|);
    $page->print;
    exit;
}

1;
