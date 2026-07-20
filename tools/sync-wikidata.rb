#!/usr/bin/ruby

require 'nokogiri'
require 'net/http'
require 'json'
require 'uri'

STDOUT.sync = true
STDERR.sync = true

WIKIPEDIA_LANGUAGES = %w[da en fr de].freeze
WIKIDATA_MAX_RETRIES = 5
WIKIDATA_REQUEST_DELAY = 0.25
WIKIDATA_USER_AGENT = 'Kalliope Wikidata sync (https://kalliope.org/)'

def fetchWikidataEntity(wikidata_id)
  url = URI("https://www.wikidata.org/wiki/Special:EntityData/#{wikidata_id}.json")
  attempts = 0

  loop do
    request = Net::HTTP::Get.new(url)
    request['User-Agent'] = WIKIDATA_USER_AGENT
    response = Net::HTTP.start(url.hostname, url.port, use_ssl: true) do |http|
      http.open_timeout = 15
      http.read_timeout = 30
      http.request(request)
    end

    if response.is_a?(Net::HTTPSuccess)
      sleep WIKIDATA_REQUEST_DELAY
      data = JSON.parse(response.body)
      entity = data.dig("entities", wikidata_id)

      if entity.nil? || entity.key?("missing")
        raise "Kunne ikke finde Wikidata-entiteten #{wikidata_id}"
      end

      return entity
    end

    retryable = response.code == '429' || response.code.start_with?('5')
    unless retryable && attempts < WIKIDATA_MAX_RETRIES
      raise "Kunne ikke hente data for #{wikidata_id}: HTTP #{response.code}"
    end

    attempts += 1
    retry_after = response['Retry-After'].to_i
    wait_seconds = retry_after.positive? ? retry_after : 2**attempts
    warn "Wikidata svarede HTTP #{response.code} for #{wikidata_id}; prøver igen om #{wait_seconds} sekunder"
    sleep wait_seconds
  end
end

def externalIds(entity)
  # Extract entity data
  claims = entity["claims"]

  external_ids = {}

  claims.each do |property, values|
    values.each do |value|
      if value["mainsnak"]["datatype"] == "external-id"
        next unless value["mainsnak"]["datavalue"].is_a?(Hash)
        external_ids[property] = value["mainsnak"]["datavalue"]["value"]
      end
    end
  end
  return external_ids
end

def wikipediaTitles(entity)
  WIKIPEDIA_LANGUAGES.to_h do |lang|
    [lang, entity.dig("sitelinks", "#{lang}wiki", "title")]
  end
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
  entity = fetchWikidataEntity(wikidataId)
  externalIds = externalIds(entity)
  wikipediaTitles = wikipediaTitles(entity)
  # Check our id
  if not externalIds['P12404'].nil? and externalIds['P12404'] != poetId
    puts "#{poetId} peger på den forkerte wikidata"
    exit
  end
  new_identifiers = Nokogiri::XML::Node.new("identifiers", doc)
  wikidataNode = Nokogiri::XML::Node.new('wikidata', doc)
  wikidataNode.content = wikidataId
  new_identifiers.add_child("\n")
  new_identifiers.add_child("    ")
  new_identifiers.add_child(wikidataNode)
  new_identifiers.add_child("\n")
  WIKIPEDIA_LANGUAGES.each do |lang|
    addIdentifierNode(wikipediaTitles, lang, "wikipedia-#{lang}", doc, new_identifiers)
  end
  addIdentifierNode(externalIds, 'P4359', 'gravsted-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P214', 'viaf', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P8313', 'lex-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P9466', 'teaterleksikon-lex-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P8341', 'biografisk-leksikon-lex-dk', doc, new_identifiers)
  addIdentifierNode(externalIds, 'P7939', 'kvindebiografisk-leksikon-lex-dk', doc, new_identifiers)
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
        puts "#{poetId} has no identifiers. Search wikidata for P12404:\"#{poetId}\""
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
