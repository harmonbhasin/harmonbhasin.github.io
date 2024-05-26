#require 'rss'
require 'feedjira'
require 'httparty'
require 'jekyll'

module ExternalPosts
  class ExternalPostsGenerator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      if site.config['external_sources'] != nil
        site.config['external_sources'].each do |src|
          p "Fetching external posts from #{src['name']}:"
          xml = HTTParty.get(src['rss_url'], headers: {
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }).body
          return if xml.nil?

          p xml

          begin
            feed = Feedjira.parse(xml)
          rescue Feedjira::NoParserAvailable
            p "No valid parser available for the feed at #{src['rss_url']}"
            next
          end

          #feed = RSS:Parser.parse(xml,false)
          feed.entries.each do |e|
            p "...fetching #{e.url}"
            slug = e.title.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
            path = site.in_source_dir("_posts/#{slug}.md")
            doc = Jekyll::Document.new(
              path, { :site => site, :collection => site.collections['posts'] }
            )
            doc.data['external_source'] = src['name'];
            doc.data['feed_content'] = e.content;
            doc.data['title'] = "#{e.title}";
            doc.data['description'] = e.summary;
            doc.data['date'] = e.published;
            doc.data['redirect'] = e.url;
            site.collections['posts'].docs << doc
          end
        end
      end
    end
  end
end
