require "json"
require "time"

class VideoFeedCache
  KEY = "videos:latest:v2"
  MAX_CACHED = 200
  TTL = 10.minutes

  class << self
    def fetch(limit:, cursor: nil)
      rows = $redis.lrange(KEY, 0, MAX_CACHED - 1)
      return nil if rows.blank?

      videos = rows.map { |row| JSON.parse(row) }
      videos = apply_cursor(videos, cursor) if cursor.present?

      videos.first(limit)
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

    private

    def apply_cursor(videos, cursor)
      cursor_time = Time.iso8601(cursor[:created_at].to_s)
      cursor_id = cursor[:id].to_i

      videos.select do |video|
        video_time = Time.iso8601(video["created_at"].to_s)
        video_id = video["id"].to_i

        video_time < cursor_time ||
          (video_time == cursor_time && video_id < cursor_id)
      end
    end
  end
end