export function getYoutubeId(url) {
    if (!url) return "";

    const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?&]+)/,
        /youtube\.com\/shorts\/([^?&]+)/,
        /youtube\.com\/embed\/([^?&]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return "";
}

export function getYoutubeThumbnailUrl(youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYoutubeEmbedUrl(youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`;
}