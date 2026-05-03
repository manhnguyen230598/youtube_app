class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "video_shares"
  end
end