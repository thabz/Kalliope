#!/usr/bin/perl

print "Content-Type: text/xml\n\n";
print <<"EOF"
<rss version="2.0">
  <channel>
     <title>Kalliope nyheder</title>
     <link>http://www.kalliope.org/</link>
     <language>da</language>
     <item>
        <title>Nyhed</title>
        <link>http://www.kalliope.org/</link>
	<description>
	En beskrivelse
	</description>
	<pubDate>Tue, 15 Nov 2005 17:48:07 +0000</pubDate>
     </item>	
     <item>
        <title>Nyhed</title>
        <link>http://www.kalliope.org/</link>
	<description>
	En beskrivelse
	</description>
     </item>	
  </channel>
</rss>

EOF
