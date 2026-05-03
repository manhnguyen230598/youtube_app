class AddDetailsToVideos < ActiveRecord::Migration[8.1]
  def change
    add_column :videos, :description, :text
    add_column :videos, :likes, :integer
    add_column :videos, :dislikes, :integer
  end
end
