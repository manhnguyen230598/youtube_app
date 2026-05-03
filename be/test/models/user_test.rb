require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user" do
    user = User.new(email: "test@example.com", password: "password123")

    assert user.valid?
  end

  test "requires email" do
    user = User.new(password: "password123")

    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "requires unique email" do
    User.create!(email: "duplicate@example.com", password: "password123")

    user = User.new(email: "duplicate@example.com", password: "password123")

    assert_not user.valid?
  end

  test "requires valid email format" do
    user = User.new(email: "invalid-email", password: "password123")

    assert_not user.valid?
  end
end