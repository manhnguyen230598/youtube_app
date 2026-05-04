class VideosController < ApplicationController
  skip_before_action :authorize_request, only: [:index]

  def index
    page = params.fetch(:page, 1).to_i
    page = 1 if page < 1

    per_page = params.fetch(:per_page, 20).to_i
    per_page = 20 if per_page < 1
    per_page = 50 if per_page > 50

    rows = Video
             .joins(:user)
             .order(created_at: :desc, id: :desc)
             .limit(per_page)
             .offset((page - 1) * per_page)
             .pluck(
               "videos.id",
               "videos.title",
               "videos.url",
               "videos.description",
               "videos.created_at",
               "users.id",
               "users.email"
             )

    videos = rows.map do |row|
      {
        id: row[0],
        title: row[1],
        url: row[2],
        description: row[3],
        created_at: row[4],
        user: {
          id: row[5],
          email: row[6]
        }
      }
    end

    render json: {
      videos: videos,
      meta: {
        page: page,
        per_page: per_page
      }
    }
  end

  def create
    video = current_user.videos.new(video_params)

    if video.save
      VideoBroadcastJob.perform_later(video.id)

      render json: {
        message: "Video shared successfully",
        video: {
          id: video.id,
          title: video.title,
          url: video.url,
          description: video.description,
          created_at: video.created_at,
          user: {
            id: current_user.id,
            email: current_user.email
          }
        }
      }, status: :created
    else
      render json: { errors: video.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def video_params
    params.permit(:title, :url, :description)
  end
end