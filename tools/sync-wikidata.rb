#!/usr/bin/ruby

require 'nokogiri'
require 'net/http'
require 'json'
require 'uri'

def fetchWikidataExternalIds(wikidata_id)
  url = URI("https://www.wikidata.org/wiki/Special:EntityData/#{wikidata_id}.json")
  response = Net::HTTP.get(url)
  data = JSON.parse(response)

  if data.nil?
    puts "Kunne ikke hente data for #{wikidata_id}"
    exit
  end

  # Extract entity data
  entity = data["entities"][wikidata_id]
  claims = entity["claims"]

  external_ids = {}

  claims.each do |property, values|
    values.each do |value|
      if value["mainsnak"]["datatype"] == "external-id"
        external_ids[property] = value["mainsnak"]["datavalue"]["value"]
      end
    end
  end
  return external_ids
end

def addIdentifierNode(externalIds, pKey, tag, doc, new_identifiers)
  id = externalIds[pKey]
  if not id.nil?
    node = Nokogiri::XML::Node.new(tag, doc)
    node.content = id
    new_identifiers.add_child("    ")
    new_identifiers.add_child(node) 
    new_identifiers.add_child("\n")
  end
end

def buildIdentifiersXml(poetId, wikidataId, doc)
  puts "Building identifiers for #{poetId} with wikidataId #{wikidataId}"
  externalIds = fetchWikidataExternalIds(wikidataId)
  if externalIds.nil?
    puts "Wikidata ikke fundet for {poetId}"
    exit
  end
  # Check our id
  if not externalIds['P12404'].nil? and externalIds['P12404'] != poetId
    puts "{poetId} peger på den forkerte wikidata"
    exit
  end
  gravsted_dk_id = externalIds['P4359']
  lex_dk_id = externalIds['P8313']
  viaf_id = externalIds['P214']
  new_identifiers = Nokogiri::XML::Node.new("identifiers", doc)
  wikidataNode = Nokogiri::XML::Node.new('wikidata', doc)
  wikidataNode.content = wikidataId
  new_identifiers.add_child("\n")
  new_identifiers.add_child("    ")
  new_identifiers.add_child(wikidataNode) 
  new_identifiers.add_child("\n")
  addIdentifierNode(externalIds, 'P4359', 'gravsted-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P214', 'viaf', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P8313', 'lex-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P9466', 'teaterleksikon-lex-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P8341', 'biografisk-leksikon-lex-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P12386', 'litteraturpriser-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P3154', 'runeberg-org', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P1938', 'gutenberg-org', doc, new_identifiers)
  new_identifiers.add_child("  ")
  return new_identifiers
end

def handlePoet(poetId)
    # Modify info.xml
    
    infoxmlfilename = "fdirs/#{poetId}/info.xml"
    infoxmlfile = File.read(infoxmlfilename)
    infoxml = Nokogiri::XML(infoxmlfile)
    poetnodes = infoxml.xpath(".//person")

    if poetnodes.first['type'] == 'collection'
        return                       
    end
    
    identifiersnodes = poetnodes.first.xpath('.//identifiers')
    
    if identifiersnodes.empty?
        puts "#{poetId} has no identifiers"
    else
        wikidatanodes = identifiersnodes.first.xpath('.//wikidata')
        if wikidatanodes.empty?
          puts "#{poetId} has identifiers but no wikidata"
        else
          wikidataId = wikidatanodes.first.content
          newIdentifiersXml = buildIdentifiersXml(poetId, wikidataId, infoxml)
          identifiersnodes.first.replace(newIdentifiersXml)
        end
    end
    
    File.open(infoxmlfilename, 'w') do |f|
        f.write infoxml.to_xml
    end
    
end

if ARGV.length > 0
    ARGV.each do |poetId|
        handlePoet(poetId)
    end
else
    Dir.entries("fdirs")
        .select { |entry| File.directory?(File.join("fdirs", entry)) && !entry.start_with?(".") }
        .sort
        .each { |poetId| 
          handlePoet(poetId)
    }
end

