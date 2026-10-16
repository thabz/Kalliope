#!/usr/bin/ruby

poetId = nil
workId = nil

if ARGV.length > 0
    poetId = ARGV[0]
end
if ARGV.length > 1
    workId = ARGV[1]
end
if poetId.nil?
    puts "Skriv digter-id: "
    poetId = gets.strip
end
if workId.nil?
  puts "Skriv værk-id: "
  workId = STDIN.gets.strip
end

folder = "fdirs/#{poetId}"

if (!File.directory?(folder))
    abort("Mappen #{folder} findes ikke.")
end

year = nil
title = nil
if m = workId.match(/\d\d\d\d/)
    year = m[0]
    puts "Skriv titel: "
    title = STDIN.gets.strip
elsif workId == 'andre'
    title = 'Andre digte'
else
    abort("Værk-id skal indeholde fire cifre eller være 'andre'")
end
yearLine = year.nil? ? "" : "    <year>#{year}</year>\n"

lines = %{<?xml version="1.0" encoding="UTF-8"?>
<kalliopework id="#{workId}" author="#{poetId}" status="incomplete" type="poetry">
<workhead>
    <title>#{title}</title>
#{yearLine}</workhead>
<workbody>
</workbody>
</kalliopework>
}

path = "#{folder}/#{workId}.xml"

if (File.file?(path))
    abort("Filen #{path} eksisterer.")
end

File.open(path, 'w') do |file|
  file.puts lines
end
