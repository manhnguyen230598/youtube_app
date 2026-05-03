class VideosController < ApplicationController
  skip_before_action :authorize_request, only: [:index]

  def index
    page = params.fetch(:page, 1).to_i
    page = 1 if page < 1

    per_page = params.fetch(:per_page, 20).to_i
    per_page = 20 if per_page < 1
    per_page = 50 if per_page > 50

    videos = Video
               .includes(:user)
               .order(created_at: :desc)
               .limit(per_page)
               .offset((page - 1) * per_page)

    render json: {
      videos: videos.as_json(
        only: [:id, :title, :url, :description, :created_at],
        include: {
          user: {
            only: [:id, :email]
          }
        }
      ),
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
        video: video.as_json(include: { user: { only: [:id, :email] } })
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