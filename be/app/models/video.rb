class Video < ApplicationRecord
  belongs_to :user

  validates :title, presence: true
  validates :url, presence: true
  validate :youtube_url

  private

  def youtube_url
    return if url.blank?

    valid = url.match?(/\Ahttps?:\/\/(www\.)?(youtube\.com|youtu\.be)\//)

    errors.add(:url, "must be a valid YouTube URL") unless valid
  end
end