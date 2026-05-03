class VideosController < ApplicationController
  skip_before_action :authorize_request, only: [:index]

  def index
    videos = Video.includes(:user).order(created_at: :desc)

    render json: videos.as_json(
      include: { user: { only: [:id, :email] } }
    )
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