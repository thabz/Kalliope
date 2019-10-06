#!/usr/bin/ruby

require 'nokogiri'
require 'fileutils'

@poemnum = 1
@poetid = nil
@date = Time.now.strftime("%Y%m%d")

def extractWorkHead(xml)
    titles_num = xml.xpath('//teiHeader/fileDesc/titleStmt/title').length
    subtitles = []
    title = xml.xpath('//teiHeader/fileDesc/titleStmt/title').each_with_index { |node, i|
        if (i == 0) 
            puts %Q|    <title>#{node.content}</title>|
        else 
            subtitles.push(node.content)
        end
    }
    if (subtitles.length == 1)
            puts %Q|    <subtitle>#{subtitles[0]}</subtitle>|
    else
        puts %Q|    <subtitle>|
        subtitles.each { |subtitle|
            puts %Q|        <line>#{subtitle}</line>|
        }
        puts %Q|    </subtitle>|
    end

end

def extractPoemBody(poemnode)
    items = poemnode.xpath("lg|l|p|sp|stage")
    items.each_with_index { |node, i|
        if node.name == "lg"
            extractPoemBody(node)
            if (i != items.size - 1)
                puts 
            end
        elsif node.name == "l" or node.name == "p"
            content = node.content.strip
            if content.size > 0
                puts content
            end
        end
    }
end

def extractText(node)
    titles = []
    title = nil
    firstline = nil

    node.xpath("head").each_with_index { |node, i|
        titles.push(node.content)
    }
    if titles.empty?
        title = ''
    else 
        title = titles[0].strip.gsub(/\n/,'')
    end

    node.css("l").each { |noden|
        if firstline.nil? or firstline.size == 0
            firstline = noden.content.gsub(/[,\.\s;:]*$/,'')
        end
    }

    if title.match(/^\d+\.?$/)
        title = "<num>#{title}</num>#{firstline}"
    end
    title = title.gsub(/\.$/,'').strip
    
    poemid = "#{@poetid}#{@date}%02d" % [@poemnum]
    @poemnum += 1
    puts %Q|<poem id="#{poemid}">|
    puts %Q|<head>|
    puts "   <title>#{title}</title>"
    puts "   <firstline>#{firstline}</firstline>"
    puts %Q|</head>|
    puts %Q|<body>|
    extractPoemBody(node)
    puts %Q|</body>|
    puts %Q|</poem>|
    puts
end

def extractSection(node)
    titles = []
    node.xpath("head").each_with_index { |node, i|
        titles.push(node.content)
    }
    puts "<section>"
    puts "<head>"
    puts "   <title>#{titles[0]}</title>"
    puts "</head>"
    puts "<content>"
    puts
    extractWorkBody(node);
    puts "</content>"
    puts "</section>"
    puts
end

def extractWorkBody(body)
    body.xpath("div").each { |node| 
        if not node.xpath("div").empty?
            extractSection(node)
        else 
            extractText(node)
        end
    }
end

def extractWork(xml)
    puts %Q|<?xml version="1.0" encoding="UTF-8"?>|
    puts %Q|<kalliopework>|
    puts %Q|<workhead>|
    extractWorkHead(xml)
    puts %Q|</workhead>|
    puts %Q|<workbody>|
    puts
    extractWorkBody(xml.xpath("/TEI//text/body"))
    puts %Q|</workbody>|
    puts %Q|</kalliopework>|
end

if (ARGV.length != 2)
    puts "USAGE: teikalliope.org poet-id xml-file"
    exit
end

@poetid = ARGV[0]
teixmlfilename = ARGV[1]
teixmlfile = File.read(teixmlfilename)
teixmlfile = teixmlfile.gsub(/<TEI[^>]+>/,'<TEI>') # Remote namespace
teixml = Nokogiri::XML(teixmlfile)

puts extractWork(teixml)

#teixml.xpath(".//person").each { |poetnode|
#    poetId = poetnode['id']
#    poetDir = "fdirs/#{poetId}"
#    if not File.directory?(poetDir)
#        Dir.mkdir(poetDir)
#    end
#
#    File.open("#{poetDir}/info.xml", 'w') do |f|
#        f.write '<?xml version="1.0" encoding="UTF-8"?>'
#        f.puts
#        f.write poetnode.to_xml
#        f.puts
#    end
#}


