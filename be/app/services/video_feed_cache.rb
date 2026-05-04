require "json"

class VideoFeedCache
  KEY = "videos:latest:v1"
  MAX_CACHED = 50
  TTL = 10.minutes

  class << self
    def fetch(page:, per_page:)
      return nil unless page.to_i == 1

      rows = $redis.lrange(KEY, 0, per_page.to_i - 1)

      return nil if rows.blank?
      return nil if rows.length < per_page.to_i

      rows.map { |row| JSON.parse(row) }
    rescue StandardError => e
      Rails.logger.warn("VideoFeedCache fetch failed: #{e.class}: #{e.message}")
      nil
    end

    def write_collection(videos)
      return if videos.blank?

      $redis.del(KEY)

      videos.first(MAX_CACHED).reverse_each do |video|
        $redis.lpush(KEY, JSON.generate(video))
      end

      $redis.expire(KEY, TTL.to_i)
    rescue StandardError => e
      Rails.logger.warn("VideoFeedCache write_collection failed: #{e.class}: #{e.message}")
    end

    def prepend(video)
      $redis.lpush(KEY, JSON.generate(video))
      $redis.ltrim(KEY, 0, MAX_CACHED - 1)
      $redis.expire(KEY, TTL.to_i)
    rescue StandardError => e
      Rails.logger.warn("VideoFeedCache prepend failed: #{e.class}: #{e.message}")
    end

    def clear
      $redis.del(KEY)
    rescue StandardError => e
      Rails.logger.warn("VideoFeedCache clear failed: #{e.class}: #{e.message}")
    end
  end
end