require "base64"
require "json"

class VideosController < ApplicationController
  skip_before_action :authorize_request, only: [:index]

  def index
    limit = params.fetch(:limit, params.fetch(:per_page, 10)).to_i
    limit = 10 if limit < 1
    limit = 50 if limit > 50

    cursor = decode_video_cursor(params[:cursor])

    if params[:cursor].present? && cursor.nil?
      render json: { error: "Invalid cursor" }, status: :bad_request
      return
    end

    cached_rows = VideoFeedCache.fetch(limit: limit + 1, cursor: cursor)

    if cached_rows.present? && cached_rows.length > limit
      rows = cached_rows
      source = "redis"
    elsif cursor.blank?
      hot_rows = video_payloads(limit: VideoFeedCache::MAX_CACHED)
      VideoFeedCache.write_collection(hot_rows)

      rows = VideoFeedCache.fetch(limit: limit + 1, cursor: nil) || []
      source = "redis_warm"
    else
      rows = video_payloads(limit: limit + 1, cursor: cursor)
      source = "db"
    end

    videos = rows.first(limit)

    render json: {
      videos: videos,
      meta: {
        limit: limit,
        per_page: limit,
        has_more: rows.length > limit,
        next_cursor: rows.length > limit ? encode_video_cursor(videos.last) : nil,
        source: source
      }
    }
  end

  def create
    video = current_user.videos.new(video_params)

    if video.save
      video_payload = {
        id: video.id,
        title: video.title,
        url: video.url,
        description: video.description,
        created_at: video.created_at&.iso8601,
        user: {
          id: current_user.id,
          email: current_user.email
        }
      }

      VideoFeedCache.prepend(video_payload)
      VideoBroadcastJob.perform_later(video.id)

      render json: {
        message: "Video shared successfully",
        video: video_payload
      }, status: :created
    else
      render json: { errors: video.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def video_params
    params.permit(:title, :url, :description)
  end

  def video_payloads(limit:, cursor: nil)
    scope = Video.joins(:user)

    if cursor.present?
      cursor_time = Time.iso8601(cursor[:created_at].to_s)
      cursor_id = cursor[:id].to_i

      scope = scope.where(
        "videos.created_at < ? OR (videos.created_at = ? AND videos.id < ?)",
        cursor_time,
        cursor_time,
        cursor_id
      )
    end

    rows = scope
             .order(Arel.sql("videos.created_at DESC, videos.id DESC"))
             .limit(limit)
             .pluck(
               "videos.id",
               "videos.title",
               "videos.url",
               "videos.description",
               "videos.created_at",
               "users.id",
               "users.email"
             )

    rows.map do |row|
      {
        id: row[0],
        title: row[1],
        url: row[2],
        description: row[3],
        created_at: row[4]&.iso8601,
        user: {
          id: row[5],
          email: row[6]
        }
      }
    end
  end

  def encode_video_cursor(video)
    return nil unless video.present?

    id = video[:id] || video["id"]
    created_at = video[:created_at] || video["created_at"]

    Base64.urlsafe_encode64(
      {
        id: id,
        created_at: created_at
      }.to_json
    )
  end

  def decode_video_cursor(cursor)
    return nil if cursor.blank?

    JSON.parse(Base64.urlsafe_decode64(cursor)).symbolize_keys
  rescue JSON::ParserError, ArgumentError
    nil
  end
end