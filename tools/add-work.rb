#!/usr/bin/ruby

poetid = ''
if ARGV.length > 0
    poetid = ARGV[0]
else
    puts "Skriv digter-id: "
    poetid = gets.strip
end

folder = "fdirs/#{poetid}"

if (!File.directory?(folder)) 
    abort("Mappen #{folder} findes ikke.")
end

puts "Skriv værk-id: "
workId = STDIN.gets.strip
year = nil
if m = workId.match(/\d\d\d\d/)
    year = m[0]
else 
    abort("Værk-id skal indeholde fire cifre")
end
puts "Skriv titel: "
title = STDIN.gets.strip

lines = %{<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE kalliopework SYSTEM "../../data/kalliopework.dtd">
<kalliopework id="#{workId}" author="#{poetid}" status="incomplete" type="poetry">
<workhead>
    <title>#{title}</title>
    <year>#{year}</year>
</workhead>
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
