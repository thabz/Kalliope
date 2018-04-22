#!/usr/bin/ruby

require 'date'

if ARGV.length != 1
  puts "Missing filename (try --help)"
  exit 0
end


@state = 'NONE'
@poemcount = 1;

@source = nil
@poetid = 'POETID'
@date = Date.today.strftime("%Y%m%d")

@poemid = nil
@firstline = nil
@title = nil, @toctitle = nil, @linktitle = nil, @indextitle = nil
@subtitles = []
@body = []
@notes = []
@keywords = nil;
@page = nil;
@written = nil;
@type = 'poem'

def printPoem()
  if @source and not @page 
      abort "FEJL: Digtet »#{@title}« mangler sideangivelse"
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
  puts "    <firstline>#{@firstline}</firstline>"
  if @notes.length > 0
    puts "    <notes>"
    @notes.each { |noteline|
      puts "        <note>#{noteline}</note>"
    }
    puts "    </notes>"
  end
  if @source and @page
    puts "    <source pages=\"#{@page}\"/>"
  end
  if @written
    puts "    <dates>"
    puts "        <written>#{@written}</written>"
    puts "    </dates>"
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
  @type = 'poem'
  @poemcount += 1
end

def printStartSektion(title)
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
  line_before = line
  while line =~ /\t/
      line = line.gsub(/\t/,'    ')
  end
  line = line.rstrip.gsub(/_(.+?)_/,'<i>\1</i>')
  if (line =~ /_/)
      STDERR.puts "ADVARSEL: Linjen »#{line_before.rstrip}« har ulige antal _"
  end
  line = line.rstrip.gsub(/=(.+?)=/,'<w>\1</w>')
  if (line =~ /=[^"]/)
      STDERR.puts "ADVARSEL: Linjen »#{line_before.rstrip}« har ulige antal ="
  end
  # Håndter {..}
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
      puts "<source facsimile=\"XXXXXX_color.pdf\" facsimile-pages-offset=\"YYY\">#{@source}</source>"
      puts ""
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
    elsif line.start_with?("F:")
      @firstline = line[2..-1].strip
    elsif line.start_with?("U:")
      @subtitles.push(line[2..-1].strip)
    elsif line.start_with?("ID:")
      @poemid = line[3..-1].strip
    elsif line.start_with?("N:")
      @keywords = line[2..-1].strip
    elsif line.start_with?("TOCTITEL:")
      @toctitle = line[9..-1].strip
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
  end
end

if @state != 'NONE'
    printPoem()
end
