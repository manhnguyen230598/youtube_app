class VideoBroadcastJob < ApplicationJob
  queue_as :default

  def perform(video_id)
    video = Video.includes(:user).find(video_id)

    User.where.not(id: video.user_id).find_each do |user|
      ActionCable.server.broadcast("notifications:#{user.id}", {
        message: "New video shared!",
        title: video.title,
        url: video.url,
        shared_by_id: video.user_id,
        shared_by_email: video.user.email
      })
    end
  end
end