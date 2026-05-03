FROM ruby:3.2.2

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libpq-dev \
  nodejs

WORKDIR /app

# Tối ưu hóa việc cài đặt gem
COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

EXPOSE 3000

# Xóa file pid cũ để tránh lỗi khi restart container đột ngột
CMD ["bash", "-c", "rm -f tmp/pids/server.pid && bundle exec rails s -b 0.0.0.0"]