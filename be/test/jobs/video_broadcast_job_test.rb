require "test_helper"

class VideoBroadcastJobTest < ActiveJob::TestCase
  include ActionCable::TestHelper

  test "broadcasts notification to other users" do
    video = videos(:one)

    assert_broadcasts "notifications:#{users(:two).id}", 1 do
      VideoBroadcastJob.perform_now(video.id)
    end
  end
end