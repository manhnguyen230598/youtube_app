require "test_helper"

class RefreshTokenTest < ActiveSupport::TestCase
  test "valid refresh token" do
    token = RefreshToken.new(
      token: SecureRandom.hex(32),
      user: users(:one),
      expires_at: 7.days.from_now
    )

    assert token.valid?
  end

  test "requires token" do
    token = RefreshToken.new(
      user: users(:one),
      expires_at: 7.days.from_now
    )

    assert_not token.valid?
  end

  test "requires expires_at" do
    token = RefreshToken.new(
      token: SecureRandom.hex(32),
      user: users(:one)
    )

    assert_not token.valid?
  end
end