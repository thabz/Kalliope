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

use Kalliope;
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

    my @cookies;
    
    if ($self->{'setremoteuser'}) {
        my $cookie = new CGI::Cookie(
            -expires => '+3M',
  	        -name => 'user',
	        -value => $self->{'setremoteuser'});
	push @cookies, $cookie;
    }
    if ($self->{'removeremoteuser'}) {
        my $cookie = new CGI::Cookie(
            -expires => '-1m',
  	        -name => 'user',
	        -value => 0);
	push @cookies, $cookie;
    }
    $self->{'cookies'} = \@cookies;

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

sub isMobile() {
   my $agent = $ENV{HTTP_USER_AGENT};
   return 1 if ($agent =~ m/android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i);
    return 1 if (substr($agent, 0, 4) =~ m/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i);
    return 0;
}
sub newAuthor {
    my ($class,%args) = @_;
    my $poet = $args{'poet'};
    my $group = $poet->getType ne 'person' ? 'persons' : 'poets';
    my $page = new Kalliope::Page(pagegroupchoosen => $group, 
                                  title => $poet->name,
                                  titleLink => "ffront.cgi?fhandle=".$poet->fhandle,
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
        $alt = _('Tilbage til hovedmenuen for %s',$poet->name);
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
    $title = $self->{'title'};
    $title = "<a href='".$self->{'titleLink'}."'>$title</a>" if $self->{'titleLink'};
    $subtitle = $self->{'subtitle'};
    my $result;
    $result .= "<h1>$title</h1>";
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
    my $titleAlign =  $args{'titleAlign'} || 'left';
    my $theme = $args{'theme'} || 'normal';
    my $cssClass = $args{'cssClass'} || '';
    my $HTML = '';
    $HTML .= qq|<div class="box $cssClass" style="text-align: $align">|;
    if ($args{title}) {
	    $HTML .= qq|<div class="listeoverskrifter" style="text-align: $titleAlign">$args{title}</div>|;
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
    	        $HTML .= qq|<div class="icon"><img width="48" height="48" border="0" src="$item{icon}" alt="$item{title}"></div>|;
    	        $HTML .= qq|<div class="title">$item{title}</div>|;
    	        $HTML .= qq|<div class="descr">$item{desc}</div>|;
	        } else {
    	        $HTML .= qq|<div class="icon"><a href="$url"><img width="48" height="48" border="0" src="$item{icon}" alt="$item{title}"></a></div>|;
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

    # If no prefer-lang in URL, redirect.
    my $redirect_lang = Kalliope::Internationalization::redirect_needed();
    if ($redirect_lang) {
	my $url;
        if ($ENV{REQUEST_URI} =~ /\/..\//) {
	    $url = "http://".$ENV{HTTP_HOST}.$ENV{REQUEST_URI};
	    $url =~ s!/../!/$redirect_lang/!;
	} else {
	    $url = "http://".$ENV{HTTP_HOST}."/".$redirect_lang.$ENV{REQUEST_URI};
	}
	print STDERR "Redirecting to $url (REQUEST_URI:".$ENV{REQUEST_URI}.")\n";

	print CGI::redirect($url);
	return;
    }

    # Set cookie if lang just selected
    if (CGI::param("clicked-lang")) {
        my $cookie = new CGI::Cookie(
            -expires => '+3M',
  	    -name => 'cookie-lang',
	    -value => CGI::param("clicked-lang"));
    	push @{$self->{'cookies'}}, $cookie;
    }

    if ($self->{'rss_feed_url'}) {
	    my $url = $self->{'rss_feed_url'};
	    my $title = $self->{'rss_feed_title'};
	    $feedlink = qq|<link rel="alternate" type="application/rss+xml" title="$title" href="$url">|;
    }
    $feedlink .= qq|<link rel="alternate" type="application/rss+xml" title="Kalliope - Seneste nyheder" href="news-feed.cgi">|;
#print CGI::header(-cookie => $c);
    if ($self->{'redirect'}) {
	    my $url = $self->{'redirect'};
	    print qq|<html><head><meta http-equiv="refresh" content="0; URL=$url"></head></html>|;
	    return;
    }
    my @c = $self->{'cookies'};
    print CGI::header(-type => 'text/html; charset=ISO-8859-1',
		      -cookie => @c);
    my $lang = Kalliope::Internationalization::language();
    print '<!DOCTYPE html>';
    print <<"EOF";
<html class="kalliope" lang="$lang">
<HEAD><TITLE>$titleForWindow</TITLE>
<LINK REL="Shortcut Icon" HREF="http://www.kalliope.org/favicon.ico">
<link rel="apple-touch-icon" href="http://www.kalliope.org/gfx/icons/iphone-icon.png">
<meta name="viewport" content="width=device-width; initial-scale=1.0" />
<link rel="search" type="application/opensearchdescription+xml" title="Kalliope" href="http://www.kalliope.org/opensearch.xml">
<link rel="stylesheet" type="text/css" href="kalliope.css">
<META HTTP-EQUIV="Content-Type" content="text/html; charset=iso-8859-1">
<META name="description" content="Stort arkiv for ældre digtning">
<META name="keywords" content="digte, lyrik, litteratur, litteraturhistorie, digtere, digtarkiv, etext, e-text, elektronisk tekst, kalliope, kalliope.org, www.kalliope.org">
$feedlink
<link href='http://fonts.googleapis.com/css?family=PT+Serif:400,700,400italic|PT+Sans:400italic,400,700' rel='stylesheet' type='text/css'>
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
        <link type="text/css" href="http://jqueryui.com/latest/themes/base/ui.all.css" rel="stylesheet"/>|;
    }
    print qq|
</HEAD>
<body link="#000000" vlink="#000000" alink="#000000">|;
 
    print '<center>';

    if (isMobile()) {
        print <<"GOOGLEADS";
<script type="text/javascript"><!--
  // XHTML should not attempt to parse these strings, declare them CDATA.
  /* <![CDATA[ */
  window.googleAfmcRequest = {
      client: 'ca-mb-pub-3823256275585089',
	      format: '320x50_mb',
	      output: 'HTML',
	      slotname: '7470613725',
	    };
  /* ]]> */
//--></script>
<script type="text/javascript"    src="http://pagead2.googlesyndication.com/pagead/show_afmc_ads.js"></script>

GOOGLEADS
    } else {	
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
        my $width = shift @widths || '';
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

    # Footer
    print '<footer>';
    print '<div class="footer">';
    print '<div class="searchbox">';
    print '<form method="get" action="ksearch.cgi">';
    print '<input class="search" name="needle" placeholder="'._("Søg i Kalliope").'">';
    print '<input type="hidden" name="sprog" value="'.$self->lang.'">';
    print '<input type="hidden" name="type" value="all">';
    print '</form>';
    print '</div> <!-- searchbox -->';
    print '<div class="flags">';
    print $self->langSelector;
    print '</div> <!-- flags -->';
    print '<div class="clear"></div>';
    print '</div> <!-- footer -->';
    print '</footer>';
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
#    print "<span style='color:white'>prefer-lang: ".Kalliope::Internationalization::language."</span><br>";
#    foreach my $k (keys %ENV) {
#       print "<span style='color:white'>$k: ".$ENV{$k}."</span><br>";
#    }
#    print "<span style='color:white'>cookie-lang: ".Kalliope::Internationalization::_cookie_lang()."</span><br>";
#    my %cookies = CGI::Cookie->fetch();
#    foreach my $k (keys %cookies) {
#       print "<span style='color:white'>Cookie '$k': ".$cookies{$k}."</span><br>";
#    }
    print '</body></html>';
}

#
# Private ------------------------------------------------------
#
sub countrySelector {
    my $self = shift;
    my $selfLang = $self->lang; 
    my $HTML;
    my %titles = ( 
        dk => _('danske'),
        gb => _('britiske'),
        us => _('amerikanske'),
        de => _('tyske'),
	fr => _('franske'),
	it => _('italienske'),
	se => _('svenske'), 
	no => _('norske'));
    
    my $url = $self->{'changelangurl'};
    
    foreach my $lang ('dk','gb','de','fr','se','no','it','us') {
       my $refURL = $url;
       $refURL =~ s/sprog=../sprog=$lang/;
       my $cssClass = $lang eq $selfLang ? 'selectedflag' : ';';
       my $alt = $lang eq $selfLang ? _('Du befinder dig i den %s samling.',$titles{$lang}) : _('Skift til den %s samling',$titles{$lang});
       $HTML .= qq|<a class="$cssClass" title="$alt" href="$refURL">|;
       $HTML .= Kalliope::Web::insertFlag($lang,$alt);
       $HTML .= qq|</a>|;
    }
    return $HTML;
}

sub langSelector {
    my $self = shift;
    my $selfLang = Kalliope::Internationalization->language(); 
    my $HTML;
    my %titles = ( 
        da => _('dansk'),
        en => _('engelsk'));
    my %flags = ( 
        da => 'dk',
        en => 'uk');
    
    my $url = $ENV{REQUEST_URI};
    
    foreach my $lang ('da','en') {
       my $refURL = $url;
       $refURL =~ s/\/..\//\/$lang\//;
       if ($refURL =~ /clicked-lang=../) {
	   $refURL =~ s/clicked-lang=../clicked-lang=$lang/;
       } elsif ($refURL =~ /\?/) {
	   $refURL .= '&clicked-lang='.$lang;
       } else {
	   $refURL .= '?clicked-lang='.$lang;
       }
       my $cssClass = $lang eq $selfLang ? 'selectedflag' : ';';
       my $alt = $lang eq $selfLang ? _('Dit sprog er %s.',$titles{$lang}) : _('Skift til %s sprog',$titles{$lang});
       $HTML .= qq|<a class="$cssClass" title="$alt" href="$refURL">|;
       $HTML .= Kalliope::Web::insertFlag($flags{$lang},$alt);
       $HTML .= qq|</a>|;
    }
    return $HTML;
}

sub menuStructs {
    my $self = shift;
    my $country = $self->lang;
    my $lang = Kalliope::Internationalization::language();

    my %menuStructs = (
         'welcome' => {'menuTitle' => '',
                       'url' => 'index.cgi',
                       'pages' => ['news']
                       },
         'om'       => {'menuTitle' => '',
                        'url' => 'index.cgi',
                       'pages' => ['about','tak','musen']
 	               },
         'poets'    => {menuTitle => _('Digtere'),
                       url => 'poetsfront.cgi?sprog='.$country,
		       icon => 'gfx/frames/menu-digtere.gif',
                       'pages' => ['poetsbyname','poetsbyyear','poetsbypic',
		                   'poetsbyflittige','poetsbypop']
                       },
         'worklist' => {menuTitle => _('Værker'),
                       url => "worksfront.cgi?sprog=$country",
		       icon => 'gfx/frames/menu-vaerker.gif',
                       pages => ['kvaerkertitel','kvaerkeraar','kvaerkerdigter',
                                 'kvaerkerpop']
                       },
         'poemlist' => {menuTitle => _('Digte'),
		       icon => 'gfx/frames/menu-digte.gif',
                       url => "poemsfront.cgi?sprog=$country",
                       pages => ['poemtitles','poem1stlines','poempopular','latest']
                       },
         'history' => {menuTitle => _('Baggrund'),
		       icon => 'gfx/frames/menu-meta.gif',
                       url => 'metafront.cgi?sprog='.$country,
                       pages => ['keywordtoc','dict','persons']
                       },
#         'forum' =>    {menuTitle => 'Forum',
#                       url => 'forumindex.cgi',
#		       icon => 'gfx/icons/forum-w64.gif',
#                       pages => ['forumindex']
#                       },
         'forumindex' => {menuTitle => _('Oversigt'),
                       url => 'forumindex.cgi'
                       },
         'poemtitles' =>{menuTitle => _('Digttitler'),
                       url => 'klines.pl?mode=1&forbogstav=A&sprog='.$country
                       },
         'poem1stlines' => {menuTitle => _('Førstelinier'),
                       url => 'klines.pl?mode=0&forbogstav=A&sprog='.$country
                       },
         'poempopular' => {menuTitle => _('Populære'),
                       url => 'klines.pl?mode=2&sprog='.$country
                       },
         'news' =>     {menuTitle => _('Nyheder'),
                       url => 'index.cgi'
                       },
         'about' =>    {menuTitle => _('Om'),
                       url => 'kabout.pl?page=about'
                       },
         'tak' =>      {menuTitle => _('Tak'),
                       url => 'kabout.pl?page=tak'
                       },
         'musen' =>     {menuTitle => _('Musen'),
                       url => 'kabout.pl?page=musen',
		       disabled => ($lang ne 'da')
                       },
         'stats' =>    {menuTitle => _('Statistik'),
                       url => 'kstats.pl'
                       },
         'latest' =>    {menuTitle => _('Tilføjelser'),
                         url => 'latest.cgi'
                       },
         'poetsbyname' => {menuTitle => _('Digtere efter navn'),
                           url => 'poets.cgi?list=az&sprog='.$country
                       },
         'poetsbyyear' => {menuTitle => _('Digtere efter år'),
                           url => 'poets.cgi?list=19&sprog='.$country
                       },
         'poetsbypic' => {menuTitle => _('Digtere efter udseende'),
                           url => 'poets.cgi?list=pics&sprog='.$country
                       },
         'poetsbyflittige' => {menuTitle => _('Flittigste digtere'),
                           url => 'poets.cgi?list=flittige&sprog='.$country
                       },
         'poetsbypop'    => {menuTitle => _('Mest populære digtere'),
                             url => 'poets.cgi?list=pop&sprog='.$country
                       },
         'kvaerkertitel' => {menuTitle => _('Værker efter titel'),
                           url => 'kvaerker.pl?mode=titel&sprog='.$country
                       },
         'kvaerkerdigter' => {menuTitle => _('Værker efter digter'),
                           url => 'kvaerker.pl?mode=digter&sprog='.$country
                       },
         'kvaerkeraar' => {menuTitle => _('Værker efter år'),
                           url => 'kvaerker.pl?mode=aar&sprog='.$country
                       },
         'kvaerkerpop' => {menuTitle => _('Mest populære værker'),
                           url => 'kvaerker.pl?mode=pop&sprog='.$country
                       },
         'keywordtoc' => {menuTitle => _('Nøgleord'),
                           url => 'keywordtoc.cgi?sprog='.$country
                       },
         'dict' => {menuTitle => _('Ordbog'),
                           url => 'dict.cgi'
                       },
         'persons' => {menuTitle => _('Biografier'),
                           url => 'persons.cgi?list=az',
                       'pages' => ['personsbyname','personsbyyear','personsbypic']
                       },
         'personsbyname' => {menuTitle => _('Personer efter navn'),
                           url => 'persons.cgi?list=az&sprog='.$country
                       },
         'personsbyyear' => {menuTitle => _('Personer efter år'),
                           url => 'persons.cgi?list=19&sprog='.$country
                       },
         'personsbypic' => {menuTitle => _('Personer efter udseende'),
                           url => 'persons.cgi?list=pics&sprog='.$country
                       },
         'timeline' => {menuTitle => _('Tidslinie'),
                           url => 'timeline.cgi&sprog='.$country
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
    
    my @menuItems = (
#        {
#            title => 'Kalliope',
#            klass => 'forside',
#            url => "index.cgi?lang=$lang",
#            caption => 'Tilbage til forsiden',
#           icon => 'gfx/icons/poet-w96.png'
#        },
        {
            title => _('Digtere'),
            url => "poetsfront.cgi?sprog=$lang",
            caption => _('Digtere'),
            icon => 'gfx/icons/poet-w96.png'
        },{
            title => _('Værker'),
            url => "worksfront.cgi?sprog=$lang",
            caption => _('Værker'),
            icon => 'gfx/icons/works-w96.png'
        },{
            title => _('Digte'),
            url => "poemsfront.cgi?sprog=$lang",
            caption => _('Digte'),
            icon => 'gfx/icons/poem-w96.png'
        },{
            title => _('Baggrund'),
            url => "metafront.cgi?sprog=$lang",
            caption => _('Om Kalliope og andet baggrundsmateriale'),
            icon => 'gfx/icons/keywords-w96.png'
        });

    my $HTML = '<div class="mainmenu"><nav><ul>';
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
    $HTML .= '<ul></nav></div> <!-- mainmenu -->';
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
        my ($title,$url,$disabled) = ($struct->{'menuTitle'},
                           $struct->{'url'},
                           $struct->{'disabled'});
	if (!$disabled) {
            if ($key ne $self->{'page'}) {
    	        push @itemsHTML, qq|<A CLASS="submenu" HREF="$url">$title</A>|;
            } else {
                push @itemsHTML, qq|<A CLASS="submenu" HREF="$url"><B>$title</B></A>|;
            }
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
    $message = $message || _('Hovsa! Der gik det galt! Siden kunne ikke findes.<br><br>Send en mail til <a href="mailto:jesper@kalliope.org">jesper@kalliope.org</a>, hvis du mener, at jeg har lavet en fejl.');
    my $HTML;
    my $picNo = int rand(10) + 1;
    my $page = new Kalliope::Page ('title' => _('Hovsa!'), nosubmenu => 1);
    $page->addBox(content => qq|<CENTER><IMG BORDER=2 SRC="gfx/notfound/$picNo.jpg" ALIGN="center"></CENTER><BR><BR>$message|);
    $page->print;
    exit;
}

1;
