#!/usr/bin/perl

do 'kstdhead.pl';

@ARGV = split (/\?/,$ARGV[0]);
chomp $ARGV[0];
$LA = $ARGV[0];

# Get the POST input
read(STDIN, $data, $ENV{'CONTENT_LENGTH'});

# Split the name-value pairs
@pairs = split(/&/, $data);

foreach $pair (@pairs) 
{
	($name, $value) = split(/=/, $pair);

	# Convert the HTML encoding
	$value =~ tr/+/ /;
	$value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
	$value =~ s/<!--(.|\n)*-->//g;

	# Convert HTML stuff as necessary.
#	$value =~ s/<([^>]|\n)*>//g;

#	print $value."<BR>";

	$FORM{$name} = $value;
}

if (($FORM{'navn'} eq '') || ($FORM{'thetext'} eq ''))  {

    &kheaderHTML("Kalliope - Whoops!",$LA);
    &beginwhitebox("Hovsa!",'50%');
    if ($FORM{'thetext'} eq '') {
	print "Du glemte at skrive noget til gæstebogen.";
    } else  {
	print "Du glemte at skrive et navn. Hvis du ønsker at være anonym, så skriv f.eks. 'Anonym kylling' eller 'Palle Pjok' istedet.";
    }
    &endbox();
} else {

    &kheaderHTML("Kalliope - Tak for indlægget",$LA);
    &beginwhitebox("Tak!","75%",'center');
    print "Dit indlæg er blevet optaget i gæstebogen.<BR><BR>";
    print "Se selv efter ved at klikke på ikonet foroven";
    &endbox();

    #TODO: Fileopen error handling
    $time = time;
    open (FILE, ">../gaestebog/".$time);
    print FILE "**D:".$time."\n";
    print FILE "**N:".$FORM{'navn'}."\n";
    print FILE "**E:".$FORM{'email'}."\n";
    print FILE "**W:".$FORM{'web'}."\n";
    $FORM{'thetext'} =~ s/\n/\<BR\>/g;
    print FILE "**T:".$FORM{'thetext'}."\n";
    close (FILE);
}

&kfooterHTML;
