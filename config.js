// ============================================
// StreamX - Configuration File
// ============================================

// TMDB API Configuration
// Get your free API key from https://www.themoviedb.org/settings/api
const TMDB_CONFIG = {
    // Replace with your TMDB API key
    API_KEY: '5c9e824d4179f4d3df8443a86b74cd7b',
    
    // Base URLs
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    
    // Image Sizes
    POSTER_SIZES: {
        small: 'w185',
        medium: 'w342',
        large: 'w500',
        original: 'original'
    },
    
    BACKDROP_SIZES: {
        small: 'w300',
        medium: 'w780',
        large: 'w1280',
        original: 'original'
    },
    
    // Default Language
    LANGUAGE: 'en-US',
    
    // Page Size
    PAGE_SIZE: 20
};

// Get full image URL
function getImageUrl(path, size = 'medium') {
    if (!path) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Crect fill="%231a1a1a" width="300" height="450"/%3E%3Ctext fill="%23666" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    
    const sizeKey = path.includes('poster') ? 'POSTER_SIZES' : 'BACKDROP_SIZES';
    const sizeValue = TMDB_CONFIG[sizeKey]?.[size] || TMDB_CONFIG.POSTER_SIZES.medium;
    
    return `${TMDB_CONFIG.IMAGE_BASE_URL}/${sizeValue}${path}`;
}

// Get poster URL
function getPosterUrl(path, size = 'medium') {
    return getImageUrl(path, size);
}

// Get backdrop URL
function getBackdropUrl(path, size = 'large') {
    return getImageUrl(path, size);
}

// API Endpoints
const API_ENDPOINTS = {
    trending: `${TMDB_CONFIG.BASE_URL}/trending/all/week`,
    popularMovies: `${TMDB_CONFIG.BASE_URL}/movie/popular`,
    popularTV: `${TMDB_CONFIG.BASE_URL}/tv/popular`,
    topRatedMovies: `${TMDB_CONFIG.BASE_URL}/movie/top_rated`,
    upcomingMovies: `${TMDB_CONFIG.BASE_URL}/movie/upcoming`,
    nowPlaying: `${TMDB_CONFIG.BASE_URL}/movie/now_playing`,
    movieDetails: (id) => `${TMDB_CONFIG.BASE_URL}/movie/${id}`,
    tvDetails: (id) => `${TMDB_CONFIG.BASE_URL}/tv/${id}`,
    searchMulti: `${TMDB_CONFIG.BASE_URL}/search/multi`,
    searchMovies: `${TMDB_CONFIG.BASE_URL}/search/movie`,
    searchTV: `${TMDB_CONFIG.BASE_URL}/search/tv`,
    movieCredits: (id) => `${TMDB_CONFIG.BASE_URL}/movie/${id}/credits`,
    tvCredits: (id) => `${TMDB_CONFIG.BASE_URL}/tv/${id}/credits`,
    discoverMovies: `${TMDB_CONFIG.BASE_URL}/discover/movie`,
    discoverTV: `${TMDB_CONFIG.BASE_URL}/discover/tv`,
    genreList: `${TMDB_CONFIG.BASE_URL}/genre/movie/list`,
    movieSimilar: (id) => `${TMDB_CONFIG.BASE_URL}/movie/${id}/similar`,
    tvSimilar: (id) => `${TMDB_CONFIG.BASE_URL}/tv/${id}/similar`,
    movieRecommendations: (id) => `${TMDB_CONFIG.BASE_URL}/movie/${id}/recommendations`,
    tvRecommendations: (id) => `${TMDB_CONFIG.BASE_URL}/tv/${id}/recommendations`,
    tvSeasonEpisodes: (id, seasonNum) => `${TMDB_CONFIG.BASE_URL}/tv/${id}/season/${seasonNum}`
};

// Build API URL with parameters
function buildApiUrl(endpoint, params = {}) {
    const url = new URL(endpoint);
    url.searchParams.append('api_key', TMDB_CONFIG.API_KEY);
    url.searchParams.append('language', TMDB_CONFIG.LANGUAGE);
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value);
        }
    });
    
    return url.toString();
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format runtime
function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Format rating
function formatRating(rating) {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
}

// Get media type display name
function getMediaTypeDisplay(mediaType) {
    const types = {
        'movie': 'Movie',
        'tv': 'TV Show',
        'person': 'Person',
        'all': 'All'
    };
    return types[mediaType] || mediaType;
}

// Get year from date string
function getYear(dateString) {
    if (!dateString) return '';
    return dateString.split('-')[0];
}

// Get quality badge
function getQualityBadge() {
    const qualities = ['HD', 'FHD', '4K'];
    return qualities[Math.floor(Math.random() * qualities.length)];
}

// Fetch Data (used by detail page)
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
