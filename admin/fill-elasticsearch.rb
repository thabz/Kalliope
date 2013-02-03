#!/usr/bin/ruby -w

require 'rubygems'
require 'json'
require 'getoptlong'
require 'rexml/document'
require 'net/http'
require 'uri'

HOST = 'http://mac-medium.local:9200'

@do_all = false
@verbose = false
@dry_run = false

def usage
  puts "Usage: fill-elasticsearch --all|<poet-id> <work-id>"
  puts "Options:"
  puts "--help                   Display this information"
  puts "--verbose                Be verbose"
  puts "--dry-run                Don't write anything"
  puts "--all                    Insert all poems. No args required."
end

def insert_work(poet_id,work_id)

  file = File.open("../data/poets.xml", "rb")
  xmldata = file.read
  xmldoc = REXML::Document.new(xmldata);
  person_node = xmldoc.elements.to_a("/persons/person[@id='#{poet_id}']").to_a.first
  person_lang = person_node.attribute('lang').value

  file = File.open("../fdirs/#{poet_id}/#{work_id}.xml", "rb")
  xmldata = file.read
  xmldoc = REXML::Document.new(xmldata, {:raw => :all});
  poem_nodes = xmldoc.elements.to_a("/kalliopework/workbody/poem").to_a
  poem_nodes.each { |poem_node|
      poem_id = poem_node.attribute('id').value;
      title = poem_node.text('head/title');
#      body = poem_node.text('body');
      body = poem_node.elements.to_a("body").to_s;
      body = body.gsub('<body>','').gsub('</body>','')
      json_str = JSON.generate({
	      "text_id"=>poem_id,
	      "poet_id"=>poet_id,
	      "work_id"=>work_id,
	      "title"=>title,
	      "lang"=>person_lang,
	      "body"=>body
      })
 
      if (@dry_run)
         puts "Would insert #{poet_id}/#{work_id}/#{poem_id}: #{title}"
      else
      puts "Insert #{poet_id}/#{work_id}/#{poem_id}: #{title}"
      uri = URI.parse("#{HOST}/kalliope/text/#{poem_id}")
      
      http = Net::HTTP.new(uri.host, uri.port)
      request = Net::HTTP::Put.new(uri.request_uri)
      request["Content-Type"] = "application/json"
      request.body = json_str

      http.request(request)
      end
  }
end

def insert_all
  file = File.open("../data/poets.xml", "rb")
  xmldata = file.read
  xmldoc = REXML::Document.new(xmldata);
  poet_nodes = xmldoc.elements.to_a("/persons/person[@type='poet']").to_a
  poet_nodes.each { |poet_node|
      poet_id = poet_node.attribute('id').value
      works_str = poet_node.text("works")
      if (works_str) 
	  works_str.split(',').each { |work_id|
	      insert_work(poet_id,work_id)
	  }
      end
  }
end

opts = GetoptLong.new(
  [ '--help', '-h', GetoptLong::NO_ARGUMENT ],
  [ '--verbose', GetoptLong::NO_ARGUMENT ],
  [ '--dry-run', GetoptLong::NO_ARGUMENT ],
  [ '--all', GetoptLong::NO_ARGUMENT]
)

opts.each do |opt, arg|
  case opt
    when '--help'
      usage
      exit 1
    when '--verbose'
      @verbose = true
    when '--all'
      @do_all = true
    when '--dry-run'
      @dry_run = true
  end
end

if (@do_all)
    insert_all()
else
if ARGV.length != 2
   usage();
   exit 0;
end

insert_work(ARGV[0],ARGV[1])
end


