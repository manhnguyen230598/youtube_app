class User < ApplicationRecord
  has_secure_password

  has_many :videos, dependent: :destroy
  has_many :refresh_tokens, dependent: :destroy

  before_validation :normalize_email

  validates :email,
            presence: true,
            uniqueness: true,
            format: { with: URI::MailTo::EMAIL_REGEXP }

  validates :password, length: { minimum: 6 }, if: -> { password.present? }

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end
end