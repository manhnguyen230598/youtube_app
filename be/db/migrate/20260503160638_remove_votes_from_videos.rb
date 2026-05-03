class RemoveVotesFromVideos < ActiveRecord::Migration[8.1]
  def change
    remove_column :videos, :likes, :integer
    remove_column :videos, :dislikes, :integer
  end
end