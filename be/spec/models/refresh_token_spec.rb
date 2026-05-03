require "rails_helper"

RSpec.describe RefreshToken, type: :model do
  it "is valid with token, user and expires_at" do
    refresh_token = build(:refresh_token)

    expect(refresh_token).to be_valid
  end

  it "requires a token" do
    refresh_token = build(:refresh_token, token: nil)

    expect(refresh_token).not_to be_valid
  end

  it "requires expires_at" do
    refresh_token = build(:refresh_token, expires_at: nil)

    expect(refresh_token).not_to be_valid
  end

  it "requires a unique token" do
    create(:refresh_token, token: "same-token")

    refresh_token = build(:refresh_token, token: "same-token")

    expect(refresh_token).not_to be_valid
  end

  it "requires a user" do
    refresh_token = build(:refresh_token, user: nil)

    expect(refresh_token).not_to be_valid
  end
end