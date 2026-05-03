class VideoBroadcastJob < ApplicationJob
  queue_as :default

  def perform(video)
    ActionCable.server.broadcast("notifications", {
      message: "New video shared!",
      title: video.title,
      url: video.url,
      user: video.user.email
    })
  end
end