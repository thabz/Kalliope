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

@firstline = nil
@title = nil, @toctitle = nil, @linktitle = nil, @indextitle = nil
@subtitle = nil
@body = []
@notes = []
@keywords = nil;
@page = nil;
@type = 'poem'

def printPoem()
  if @source and not @page and
      abort "FEJL: Digtet »#{@title}« mangler sideangivelse"
  end
  puts "<#{@type} id=\"#{@poetid}#{@date}#{'%02d' % @poemcount}\">"
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
  if @subtitle
    puts "    <subtitle>#{@subtitle}</subtitle>"
  end
  puts "    <firstline>#{@firstline}</firstline>"
  if (@source && @page) || @notes.length > 0
    pp = @page.include?('-') ? 'pp' : 'p';
    puts "    <notes>"
    @notes.each { |noteline|
    puts "        <note>#{noteline}</note>"
    }
    puts "        <note>#{@source.gsub(/[\. ]*$/,'')}, #{pp}. #{@page}.</note>"
    puts "    </notes>"
  end
  if @keywords
    puts "    <keywords>#{@keywords}</keywords>"
  end
  puts "    <quality>korrektur1,kilde,side</quality>"
  puts "</head>"
  puts "<body>"
  puts @body.join("\n").strip
  puts "</body>"
  puts "</#{@type}>"
  puts ""
  @firstline = nil
  @title = nil 
  @toctitle = nil
  @linktitle = nil
  @indextitle = nil
  @subtitle = nil
  @body = []
  @notes = []
  @keywords = nil
  @page = nil
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
  if @state == 'NONE' and line =~ /^KILDE:/
      @source = line[6..-1].strip
  end
  if @state == 'NONE' and line =~ /^DIGTER:/
      @poetid = line[7..-1].strip
  end
  if @state == 'NONE' and line =~ /^DATO:/
      @date = line[5..-1].strip
  end
  if @state == 'NONE' and line =~ /^T:/
    @state = 'INHEAD'
  end
  if @state == 'INBODY' and line.start_with?("T:")
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
      printPoem();
      printEndSection();
      @state = 'NONE'
  end
  if @state == 'INHEAD'
    if line.start_with?("T:")
      @title = line[2..-1].strip
    elsif line.start_with?("F:")
      @firstline = line[2..-1].strip
    elsif line.start_with?("U:")
      @subtitle = line[2..-1].strip
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
    elsif line.start_with?("TYPE:")
      @type = line[5..-1].strip == "prosa" ? "prose" : "poem"
    elsif line =~ /^[A-Z]*:/
      abort "Unknown header-line: #{line}"
    else
      @state = 'INBODY'
    end
  end
  if @state == 'INBODY'
      line_before = line
      line = line.rstrip.gsub(/_(.+?)_/,'<i>\1</i>')
      if (line =~ /_/)
          abort "FEJL: Linjen »#{line_before.rstrip}« har ulige antal _"
      end
      line = line.rstrip.gsub(/=(.+?)=/,'<w>\1</w>')
      if (line =~ /=/)
          abort "FEJL: Linjen »#{line_before.rstrip}« har ulige antal ="
      end
    @body.push(line)
  end
end

if @state != 'NONE'
    printPoem()
end
