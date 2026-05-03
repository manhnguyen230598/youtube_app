class AddIndexToVideosCreatedAt < ActiveRecord::Migration[8.1]
  def change
    add_index :videos, :created_at
  end
end