#!/usr/bin/ruby

require 'nokogiri'
require 'fileutils'


poetsxmlfile = File.read("data/poets.xml")
poetsxml = Nokogiri::XML(poetsxmlfile)
poetsxml.xpath(".//person").each { |poetnode|
    poetId = poetnode['id']
    poetDir = "fdirs/#{poetId}"
    if not File.directory?(poetDir)
        Dir.mkdir(poetDir)
    end

    File.open("#{poetDir}/info.xml", 'w') do |f|
        f.write '<?xml version="1.0" encoding="UTF-8"?>'
        f.puts
        f.write poetnode.to_xml
        f.puts
    end
}

exit

