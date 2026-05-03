class VideoBroadcastJob < ApplicationJob
  queue_as :default

  def perform(video_id)
    video = Video.includes(:user).find(video_id)

    ActionCable.server.broadcast("video_shares", {
      message: "New video shared!",
      video_id: video.id,
      title: video.title,
      url: video.url,
      shared_by_id: video.user_id,
      shared_by_email: video.user.email,
      created_at: video.created_at
    })
  end
end