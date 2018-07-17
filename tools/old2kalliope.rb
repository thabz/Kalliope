#!/usr/bin/ruby

require 'date'

def printTemplate() 
    puts "KILDE:"
    puts "DIGTER:"
    puts "FACSIMILE:"
    puts "FACSIMILE-SIDER:"
    puts ""
    puts "SEKTION:"
    puts ""
    puts "T:"
    puts "F:"
    puts "SIDE:"
    puts ""
    puts "SLUTSEKTION"
end

if ARGV.length != 1
  printTemplate()
  exit 0
end

@state = 'NONE'
@poemcount = 1;
@header_printed = false

# Work data
@poetid = 'POETID'
@date = Date.today.strftime("%Y%m%d")
@source = nil
@facsimile = 'XXXXXX_color.pdf'
@facsimile_pages_num = 150
@worknotes = []
@found_corrections = false
@found_poet_notes = false

# Poem data
@poemid = nil
@firstline = nil
@title = nil, @toctitle = nil, @linktitle = nil, @indextitle = nil
@subtitles = []
@body = []
@notes = []
@keywords = nil;
@page = nil;
@written = nil;
@performed = nil;
@event = nil
@type = 'poem'
@variant = nil

def printHeader()
    if @header_printed
        return
    end
    year = "ÅR"
    title = "TITEL"
    if @source 
        m = @source.match(/<i>(.*?)<\/i>.*(\d\d\d\d)[\s\.]*$/)
        if m 
            title = m[1]
            year = m[2]
        end
    end

    puts %Q|<?xml version="1.0" encoding="UTF-8"?>|
    puts %Q|<!DOCTYPE kalliopework SYSTEM "../../data/kalliopework.dtd">|
    puts %Q|<kalliopework id="#{year}" author="#{@poetid}" status="complete" type="poetry">|
    puts %Q|<workhead>|
    puts %Q|    <title>#{title}</title>|
    puts %Q|    <year>#{year}</year>|
    puts %Q|    <notes>|
    @worknotes.each { |noteline|
      puts "        <note>#{noteline}</note>"
    }
    puts %Q|        <note>Teksten følger #{@source}</note>|
    if @found_corrections      
        puts %Q|        <note>Stavemåde og tegnsætning følger samvittighedsfuldt originaludgaven, kun åbenbare fejl er rettet og i alle tilfælde med originalens ordlyd anmærket i digtnoten, så læseren selv kan vurdere rigtigheden af en rettelse.</note>|
    end
    if @found_poet_notes
        puts %Q|        <note>Noter med en foranstillet asterisk er digterens egne.</note>|
    end
    puts %Q|    </notes>|
    puts %Q|    <pictures>|
    puts %Q|        <picture src="#{year}-p1.jpg">Titelbladet til <i>#{title}</i> (#{year}) lyder ,,''.</picture>|
    puts %Q|    </pictures>|
    puts %Q|    <source facsimile="#{@facsimile}" facsimile-pages-num="#{@facsimile_pages_num}" facsimile-pages-offset="10">#{@source}</source>|
    puts %Q|</workhead>|
    puts %Q|<workbody>|
    puts ""
    @header_printed = true
end

def printFooter()
    puts "</workbody>"
    puts "</kalliopework>"
end

def printPoem()
  printHeader()
  if @source and not @page 
      abort "FEJL: Digtet »#{@title}« mangler sideangivelse"
  end
  if @source and @page =~ /\d-$/
      abort "FEJL: Digtet »#{@title}« har kun halv sideangivelse: #{@page}"
  end
  if @type == 'poem' and (@firstline.nil? || @firstline.strip.length == 0)
      abort "FEJL: Digtet »#{@title}« mangler førstelinje"
  end
  poemid = @poemid || "#{@poetid}#{@date}#{'%02d' % @poemcount}"
  puts "<#{@type} id=\"#{poemid}\">"
  puts "<head>"
  puts "    <title>#{@title}</title>"
  if @toctitle
    puts "    <toctitle>#{@toctitle}</toctitle>"
  end
  if @indextitle
    puts "    <indextitle>#{@indextitle}</indextitle>"
  end
  if @linktitle
    puts "    <linktitle>#{@linktitle}</linktitle>"
  end
  if @subtitles.length == 1
    puts "    <subtitle>#{@subtitles[0]}</subtitle>"
  elsif @subtitles.length > 1
    puts "    <subtitle>"
    @subtitles.each { |line|
        puts "        <line>#{line}</line>"
    }
    puts "    </subtitle>"
  end
  if (@type != 'prose')
    puts "    <firstline>#{@firstline}</firstline>"
  end
  if @notes.length > 0
    puts "    <notes>"
    @notes.each { |noteline|
      puts "        <note>#{noteline}</note>"
    }
    puts "    </notes>"
  end
  if @source and @page
      if (@page =~ /[ivx]+/i) 
        puts "    <source pages=\"#{@page}\" facsimile-pages=\"10\" />"
      else 
        puts "    <source pages=\"#{@page}\"/>"
      end
  end
  if @written or @performed or @event
    puts "    <dates>"
    if @written
      puts "        <written>#{@written}</written>"
    end
    if @performed
      puts "        <performed>#{@performed}</performed>"
    end
    if @event
      puts "        <event>#{@event}</event>"
    end
    puts "    </dates>"
  end
  if @variant
    puts "    <variant>#{@variant}</variant>"
  end
  if @keywords
    puts "    <keywords>#{@keywords}</keywords>"
  end
  puts "    <quality>korrektur1,kilde,side</quality>"
  puts "</head>"
  puts "<body>"
  first_non_empty_line = @body.find_index { |line| line =~ /[^\s]/ }
  puts @body[first_non_empty_line,100000].join("\n").rstrip
  puts "</body>"
  puts "</#{@type}>"
  puts ""
  @poemid = nil
  @firstline = nil
  @title = nil 
  @toctitle = nil
  @linktitle = nil
  @indextitle = nil
  @subtitles = []
  @body = []
  @notes = []
  @keywords = nil
  @page = nil
  @written = nil
  @performed = nil
  @event = nil
  @type = 'poem'
  @variant = nil
  @poemcount += 1
end

def printStartSektion(title)
  printHeader()
  puts "<section>"
  puts "<head>"
  puts "    <title>#{title}</title>"
  puts "</head>"
  puts "<content>"
  puts ""
end    

def printEndSection()
  puts "</content>"
  puts "</section>"
  puts ""
end

File.readlines(ARGV[0]).each do |line|
  if line =~ /<note>.*\] .*<\/note>/
    @found_corrections = true
  end
  if line =~ /<note>\* .*<\/note>/
    @found_poet_notes = true
  end
end

File.readlines(ARGV[0]).each do |line|
  line_before = line
  while line =~ /\t/
      line = line.gsub(/\t/,'    ')
  end
  if not line =~ /^FACSIMILE:/ and not line =~ /http/
      line = line.rstrip.gsub(/_(.+?)_/,'<i>\1</i>')
      if (line =~ /_/)
          STDERR.puts "ADVARSEL: Linjen »#{line_before.rstrip}« har ulige antal _"
      end
  end
  line = line.rstrip.gsub(/=(.+?)=/,'<w>\1</w>')
  if (line =~ /=[^"]/)
      STDERR.puts "ADVARSEL: Linjen »#{line_before.rstrip}« har ulige antal ="
  end
  # Håndter {..} TODO: Fang manglende }
  m = /{(.*?):(.*)}/.match(line)
  if (!m.nil?)
      l = m[2]
      if m[1].include? "b"
          l = "<b>#{l}</b>"
      end
      if m[1].include? "i"
          l = "<i>#{l}</i>"
      end
      if m[1].include? "w"
          l = "<w>#{l}</w>"
      end
      if m[1].include? "c"
          l = "<center>#{l}</center>"
      end
      if m[1].include? "r"
          l = "<right>#{l}</right>"
      end
      if m[1].include? "p"
          l = "<wrap>#{l}</wrap>"
      end
      if m[1].include? "s"
          l = "<small>#{l}</small>"
      end
      l = "<nonum>#{l}</nonum>"
      line = l
  end
  if @state == 'NONE' and line =~ /^KILDE:/
      @source = line[6..-1].strip
  end
  if @state == 'NONE' and line =~ /^FACSIMILE:/
      @facsimile = line.gsub(/^FACSIMILE:/,'').strip
  end
  if @state == 'NONE' and line =~ /^FACSIMILE-SIDER:/
      @facsimile_pages_num = line.gsub(/^FACSIMILE-SIDER:/,'').strip
  end
  if @state == 'NONE' and line =~ /^VÆRKNOTE:/
      @worknotes.push(line.gsub(/^VÆRKNOTE:/,'').strip)
  end
  if @state == 'NONE' and line =~ /^DIGTER:/
      @poetid = line[7..-1].strip
  end
  if @state == 'NONE' and line =~ /^DATO:/
      @date = line[5..-1].strip
  end
  if @state == 'NONE' and (line =~ /^T:/ or line =~ /^ID:/)
    @state = 'INHEAD'
  end
  if @state == 'INBODY' and (line.start_with?("T:") or line.start_with?("ID:"))
    printPoem()
    @state = 'INHEAD'
  end
  if line.start_with?('SEKTION:')
      if (@state == 'INBODY')
          printPoem();
      end
      sectionTitle = line[8..-1].strip
      print printStartSektion(sectionTitle)
      @state = 'NONE'
  end
  if line.start_with?('SLUTSEKTION')
      if @state != 'NONE'
          printPoem();
      end
      printEndSection();
      @state = 'NONE'
  end
  if @state == 'INHEAD'
    if line.start_with?("T:")
      @title = line[2..-1].strip
      if @title =~ /<num>/
          @stripped = @title.gsub(/<num>.*<\/num>/,'')
          @toctitle = @title
          @linktitle = @stripped
          @indextitle = @stripped
      end
    elsif line.start_with?("F:")
      unless @firstline.nil?
          abort "FEJL: Digtet »#{@title}« har mere end én F:"
      end
      @firstline = line[2..-1].strip
    elsif line.start_with?("U:")
      @subtitles.push(line[2..-1].strip)
    elsif line.start_with?("ID:")
      @poemid = line[3..-1].strip
    elsif line.start_with?("N:")
      @keywords = line[2..-1].strip
    elsif line.start_with?("TOCTITEL:")
      @toctitle = line[9..-1].strip
      if @toctitle =~ /<num>.*?<\/num>$/ 
        abort "FEJL: Digtet »#{@title}« mangler titel i TOCTITEL:"
      end
    elsif line.start_with?("INDEXTITEL:")
      @indextitle = line[11..-1].strip
    elsif line.start_with?("LINKTITEL:")
      @linktitle = line[10..-1].strip
    elsif line.start_with?("NOTE:")
      @notes.push(line[5..-1].strip)
    elsif line.start_with?("SIDE:")
      @page = line[5..-1].strip
    elsif line.start_with?("SKREVET:")
      @written = line[8..-1].strip
    elsif line.start_with?("FREMFØRT:")
      @written = line[9..-1].strip
    elsif line.start_with?("BEGIVENHED:")
      @event = line.gsub(/^BEGIVENHED:/,'').strip
    elsif line.start_with?("VARIANT:")
      @variant = line[8..-1].strip
    elsif line.start_with?("TYPE:")
      @type = line[5..-1].strip == "prosa" ? "prose" : "poem"
    elsif line =~ /^[A-Z]*:/
      abort "Unknown header-line: #{line}"
    else
      @state = 'INBODY'
    end
  end
  if @state == 'INBODY'
      @body.push(line)
      if line =~ /<note>.*\] .*<\/note>/
          @found_corrections = true
      end
      if line =~ /<note>\* .*<\/note>/
          @found_poet_notes = true
      end
  end
end

if @state != 'NONE'
    printPoem()
end

printFooter()

