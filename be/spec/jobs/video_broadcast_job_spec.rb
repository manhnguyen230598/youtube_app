require "rails_helper"

RSpec.describe VideoBroadcastJob, type: :job do
  include ActionCable::TestHelper

  it "broadcasts video share notification once to the video_shares stream" do
    owner = create(:user)
    video = create(:video, user: owner)

    expect {
      described_class.perform_now(video.id)
    }.to have_broadcasted_to("video_shares").with(
      hash_including(
        message: "New video shared!",
        video_id: video.id,
        title: video.title,
        url: video.url,
        shared_by_id: owner.id,
        shared_by_email: owner.email
      )
    )
  end
end