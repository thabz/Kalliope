#!/usr/bin/perl -w

use strict;
use lib '..';

use Kalliope::DB;

my $dbh = Kalliope::DB::connect();

my $prefix = "../fdirs/";
my $sthw = $dbh->prepare("SELECT * FROM vaerker");
$sthw->execute;

my $sthp = $dbh->prepare("SELECT * FROM digte WHERE vid = ?");
my $sthkeywords = $dbh->prepare("SELECT k.ord FROM keywords k, keywords_relation x WHERE x.otherid = ? AND x.othertype = ? AND k.id = x.keywordid");

while (my $w = $sthw->fetchrow_hashref) {
#    next unless $$w{fhandle} eq 'andersen';
    my $vid = $w->{'vid'};
    my $outfile = $prefix.$$w{fhandle}.'/'.$$w{vhandle}.'.xml';
    open (OUT,">$outfile");
    print OUT qq(<?xml version="1.0" encoding="ISO-8859-1"?>\n);
    my $type = $$w{type} eq 'p' ? 'prose' : 'poetry';
    print OUT qq(<kalliopework id="$$w{vhandle}" author="$$w{fhandle}" status="$$w{status}" type="$type">\n);
    print OUT qq(<workhead>\n);
    print OUT qq(   <title>$$w{titel}</title>\n);
    chomp $$w{underoverskrift} if $$w{underoverskrift};
    print OUT qq(   <subtitle>$$w{underoverskrift}</subtitle>\n) if $$w{underoverskrift};
    print OUT qq(   <year>$$w{aar}</year>\n);
    printNotes($$w{noter});
    printPics($$w{pics});
    print OUT qq(   <quality>$$w{quality}</quality>\n) if $$w{quality};
    my $keywords = keywords($vid,'vaerk');
    if ($keywords) {
       print OUT qq(   <keywords>$keywords</keywords>)."\n";
    }
    print OUT q(   <cvs-timestamp>$Id$</cvs-timestamp>)."\n";
    print OUT qq(</workhead>\n);
    if ($$w{findes} == 1) {
        $sthp->execute($vid);
	print OUT qq(<workbody>\n);
	while (my $p = $sthp->fetchrow_hashref) {
	    printPoem($p);
	}
	print OUT qq(</workbody>\n);
    }
    print OUT "</kalliopework>\n";
    close (OUT);
    print "$outfile written\n";
}

sub printPoem {
    my $p = shift;
    my $type = $$p{layouttype} eq 'prosa' ? 'prose' : 'poetry';
    print OUT qq(\n<text id="$$p{longdid}" type="$type">\n);
    print OUT qq(<head>\n);
    print OUT qq(   <title>$$p{titel}</title>\n) if ($$p{titel});
    print OUT qq(   <subtitle>$$p{underoverskrift}</subtitle>\n) if ($$p{underoverskrift});
    print OUT qq(   <toctitle>$$p{toctitel}</toctitle>\n) if ($$p{toctitel});
    print OUT qq(   <indexitle>$$p{tititel}</indextitle>\n) if ($$p{tititel});
    print OUT qq(   <firstline>$$p{foerstelinie}</firstline>\n) if ($$p{foerstelinie});
    printNotes($$p{noter});
    printPics($$p{pics});
    print OUT qq(   <quality>$$p{quality}</quality>\n) if ($$p{quality});
    my $keywords = keywords($$p{did},'digt');
    if ($keywords) {
       print OUT qq(   <keywords>$keywords</keywords>)."\n";
    }
    print OUT qq(</head>\n);
    print OUT qq(<body>\n);
    print OUT fixHTML($$p{indhold});
    print OUT qq(\n</body>\n);
    print OUT qq(</text>\n);
}

sub printNotes {
    my $gah = shift;
    return unless $gah;
	chomp $gah;
	my @notes = split "\n",fixHTML($gah);
        print OUT qq(   <notes>\n);
	foreach my $note (@notes) {
	    next unless $note;
            print OUT qq(      <note>$note</note>\n);
	}
        print OUT qq(   </notes>\n);
}

sub printPics {
    my $gah = shift;
    if ($gah) {
	chomp $gah;
	my @pics = split /\$\$\$/,fixHTML($gah);
        print OUT qq(   <pictures>\n);
	foreach my $pic (@pics) {
	    my ($src,$note) = split '%',$pic;
	    chomp $note if $note;
            print OUT qq(      <picture src="$src">$note</picture>\n);
	}
        print OUT qq(   </pictures>\n);
    }
}

sub fixHTML {
    my $s = shift;
    return '' unless $s;
    $s =~ s/<br>/<br\/>/ig;
    $s =~ s/<I>/<i>/ig;
    $s =~ s/<\/I>/<\/i>/ig;
    $s =~ s/\&bdquo;/,,/ig;
    $s =~ s/\&ldquo;/''/ig;
    $s =~ s/<xref(.*?)>/<xref$1\/>/ig;
    return $s;
}

sub keywords {
    my ($id,$type) = @_;
    my @keywords;
    $sthkeywords->execute($id,$type);
    while (my $ord = $sthkeywords->fetchrow_array) {
       push @keywords,$ord;
    }
    return join ",",@keywords;
}
