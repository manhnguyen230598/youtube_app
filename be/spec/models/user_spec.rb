require "rails_helper"

RSpec.describe User, type: :model do
  it "is valid with a valid email and password" do
    user = build(:user)

    expect(user).to be_valid
  end

  it "requires an email" do
    user = build(:user, email: nil)

    expect(user).not_to be_valid
    expect(user.errors[:email]).to include("can't be blank")
  end

  it "requires a unique email" do
    create(:user, email: "duplicate@example.com")

    user = build(:user, email: "duplicate@example.com")

    expect(user).not_to be_valid
  end

  it "normalizes email before validation" do
    user = create(:user, email: " TEST@EXAMPLE.COM ")

    expect(user.email).to eq("test@example.com")
  end

  it "requires a valid email format" do
    user = build(:user, email: "wrong-email")

    expect(user).not_to be_valid
  end

  it "requires password to be at least 6 characters" do
    user = build(:user, password: "123")

    expect(user).not_to be_valid
  end
end