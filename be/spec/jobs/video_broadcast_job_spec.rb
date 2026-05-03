require "rails_helper"

RSpec.describe VideoBroadcastJob, type: :job do
  include ActionCable::TestHelper

  it "broadcasts notification to other users" do
    owner = create(:user)
    receiver = create(:user)
    video = create(:video, user: owner)

    expect {
      described_class.perform_now(video.id)
    }.to have_broadcasted_to("notifications:#{receiver.id}").with(
      hash_including(
        title: video.title,
        url: video.url,
        shared_by_id: owner.id,
        shared_by_email: owner.email
      )
    )
  end

  it "does not broadcast notification to the video owner" do
    owner = create(:user)
    create(:user)
    video = create(:video, user: owner)

    expect {
      described_class.perform_now(video.id)
    }.not_to have_broadcasted_to("notifications:#{owner.id}")
  end
end