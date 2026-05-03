class VideosController < ApplicationController
  skip_before_action :authorize_request, only: [:index]

  # GET /videos
  def index
    videos = Video.includes(:user).order(created_at: :desc)
    render json: videos.as_json(
      include: { user: { only: [:id, :email] } }
    )
  end

  # POST /videos
  def create
    video = current_user.videos.new(video_params)
    video.likes ||= 0
    video.dislikes ||= 0

    if video.save
      VideoBroadcastJob.perform_later(video)
      render json: { message: "Video shared successfully", video: video }, status: :created
    else
      render json: { errors: video.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def video_params
    params.permit(:title, :url, :description)
  end
end