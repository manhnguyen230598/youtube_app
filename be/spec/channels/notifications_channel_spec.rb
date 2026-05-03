require "rails_helper"

RSpec.describe NotificationsChannel, type: :channel do
  let(:user) { create(:user) }

  before do
    stub_connection current_user: user
  end

  it "subscribes to current user's notification stream" do
    subscribe

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from("notifications:#{user.id}")
  end
end