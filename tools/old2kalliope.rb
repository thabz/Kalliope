#!/usr/bin/ruby

require 'date'

if ARGV.length != 1
  puts "Missing filename (try --help)"
  exit 0
end

@date = Date.today.strftime("%Y%m%d")

@state = 'NONE'
@poemcount = 1;

@source = nil
@poetid = 'POETID'

@firstline = nil
@title = nil
@subtitle = nil
@body = []
@keywords = nil;
@page = nil;

def printPoem()
  if @source and not @page
      puts "FEJL: Digtet »#{@title}« mangler sideangivelse"
      exit
  end
  puts "<poem id=\"#{@poetid}#{@date}#{'%02d' % @poemcount}\">"
  puts "<head>"
  puts "    <title>#{@title}</title>"
  if @subtitle
    puts "    <subtitle>#{@subtitle}</subtitle>"
  end
  puts "    <firstline>#{@firstline}</firstline>"
  if @source && @page
    pp = @page.include?('-') ? 'pp' : 'p';
    puts "    <notes>"
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
  puts "</poem>"
  puts ""
  @firstline = nil
  @title = nil
  @subtitle = nil
  @body = []
  @keywords = nil
  @page = nil
  @poemcount += 1
end

File.readlines(ARGV[0]).each do |line|
  if @state == 'NONE' and line =~ /^KILDE:/
      @source = line[6..-1].strip
  end
  if @state == 'NONE' and line =~ /^DIGTER:/
      @poetid = line[7..-1].strip
  end
  if @state == 'NONE' and line =~ /^T:/
    @state = 'INHEAD'
  end
  if @state == 'INBODY' and line.start_with?("T:")
    printPoem()
    @state = 'INHEAD'
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
    elsif line.start_with?("SIDE:")
      @page = line[5..-1].strip
    elsif line =~ /^.:/
      throw "Unknown header-line: #{line}"
    else
      @state = 'INBODY'
    end
  end
  if @state == 'INBODY'
      line = line.rstrip.gsub(/_(.+?)_/,'<i>\1</i>')
    @body.push(line)
  end
end

printPoem()
