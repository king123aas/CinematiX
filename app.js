// ============================================
// CinematiX - Main Application JavaScript
// ============================================

// Application State
const AppState = {
    currentCategory: 'all',
    currentPage: 1,
    searchQuery: '',
    filters: {
        category: 'all',
        genre: '',
    },
    cachedData: {}
};

// Favorites Management
const FavoritesManager = {
    getAll() {
        const favorites = localStorage.getItem('streamx_favorites');
        return favorites ? JSON.parse(favorites) : { watching: [], planToWatch: [], finished: [], dropped: [] };
    },

    save(favorites) {
        localStorage.setItem('streamx_favorites', JSON.stringify(favorites));
    },

    add(item, status) {
        const favorites = this.getAll();
        const itemData = {
            id: Number(item.id), // Ensure ID is stored as number
            media_type: item.media_type || 'movie',
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
            addedAt: new Date().toISOString()
        };
        
        // Remove from all lists first
        ['watching', 'planToWatch', 'finished', 'dropped'].forEach(key => {
            favorites[key] = favorites[key].filter(i => Number(i.id) !== Number(item.id));
        });
        
        // Add to the selected status
        favorites[status].push(itemData);
        this.save(favorites);
        return favorites;
    },

    remove(itemId) {
        const favorites = this.getAll();
        const numItemId = Number(itemId);
        ['watching', 'planToWatch', 'finished', 'dropped'].forEach(key => {
            favorites[key] = favorites[key].filter(i => Number(i.id) !== numItemId);
        });
        this.save(favorites);
        return favorites;
    },

    getStatus(itemId) {
        const favorites = this.getAll();
        const numItemId = Number(itemId);
        for (const [status, items] of Object.entries(favorites)) {
            // Check both string and number to handle legacy data
            if (items.some(i => Number(i.id) === numItemId || String(i.id) === String(itemId))) return status;
        }
        return null;
    },

    getByStatus(status) {
        return this.getAll()[status] || [];
    }
};

// DOM Elements
const elements = {
    header: document.querySelector('.header'),
    logo: document.querySelector('.logo'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    menuToggle: document.getElementById('menuToggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    heroSection: document.getElementById('heroSection'),
    heroTitle: document.getElementById('heroTitle'),
    heroDescription: document.getElementById('heroDescription'),
    playBtn: document.getElementById('playBtn'),
    infoBtn: document.getElementById('infoBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    genreFilter: document.getElementById('genreFilter'),
    trendingContent: document.getElementById('trendingContent'),
    moviesContent: document.getElementById('moviesContent'),
    tvshowsContent: document.getElementById('tvshowsContent'),
    topratedContent: document.getElementById('topratedContent'),
    topratedTvContent: document.getElementById('topratedTvContent'),
    upcomingContent: document.getElementById('upcomingContent'),
    upcomingTvContent: document.getElementById('upcomingTvContent'),
    nowplayingContent: document.getElementById('nowplayingContent'),
    ontvContent: document.getElementById('ontvContent'),
    detailModal: document.getElementById('detailModal'),
    modalClose: document.getElementById('modalClose'),
    modalBody: document.getElementById('modalBody'),
    loading: document.getElementById('loading'),
    searchModal: document.getElementById('searchModal'),
    searchModalClose: document.getElementById('searchModalClose'),
    searchModalBody: document.getElementById('searchModalBody'),
    navLinks: document.querySelectorAll('.nav-link, .mobile-nav-link')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Setup event listeners first
    setupEventListeners();
    
    // Initialize favorites tabs
    initFavoritesTabs();
    
    // Load initial content
    loadInitialContent();
    
    // Show sections for default category (home/all)
    showSectionsForCategory('all');
    
    // Setup scroll effects
    setupScrollEffects();
    
    // Setup intersection observer for animations
    setupIntersectionObserver();
}

// Setup Event Listeners
function setupEventListeners() {
    // Logo click - go to home
    if (elements.logo) {
        elements.logo.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger click on home nav link
            const homeLink = document.querySelector('.nav-link[data-category="all"]');
            if (homeLink) {
                homeLink.click();
            }
        });
    }
    
    // Header scroll effect
    window.addEventListener('scroll', handleScroll);
    
    // Mobile menu toggle
    elements.menuToggle.addEventListener('click', toggleMobileMenu);
    
    // Search functionality
    elements.searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Toggle search container active state on mobile
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && window.innerWidth <= 768) {
            searchContainer.classList.toggle('active');
            if (searchContainer.classList.contains('active')) {
                const input = searchContainer.querySelector('input');
                if (input) {
                    input.focus();
                }
            }
        }
        handleSearch();
    });
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Navigation links
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
    
    // Filters
    elements.categoryFilter.addEventListener('change', handleFilterChange);
    elements.genreFilter.addEventListener('change', handleFilterChange);
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) closeModal();
    });
    
    // Hero buttons
    elements.playBtn.addEventListener('click', () => {
        const heroMovie = AppState.cachedData.trending?.[AppState.heroIndex || 0];
        if (heroMovie) {
            const type = heroMovie.media_type === 'tv' ? 'tv' : 'movie';
            window.location.href = `detail.html?id=${heroMovie.id}&type=${type}`;
        }
    });
    
    elements.infoBtn.addEventListener('click', () => {
        const heroMovie = AppState.cachedData.trending?.[AppState.heroIndex || 0];
        if (heroMovie) {
            const type = heroMovie.media_type === 'tv' ? 'tv' : 'movie';
            window.location.href = `detail.html?id=${heroMovie.id}&type=${type}`;
        }
    });
    
    // Auto-cycle hero content every 5 seconds
    setInterval(() => {
        if (AppState.cachedData.trending && AppState.cachedData.trending.length > 0) {
            const currentIndex = AppState.heroIndex || 0;
            updateHeroContent(currentIndex + 1);
        }
    }, 5000);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            elements.mobileMenu.classList.remove('active');
        }
    });
}

// Handle Scroll
function handleScroll() {
    if (window.scrollY > 50) {
        elements.header.classList.add('scrolled');
    } else {
        elements.header.classList.remove('scrolled');
    }
}

// Setup Scroll Effects
function setupScrollEffects() {
    handleScroll();
}

// Toggle Mobile Menu
function toggleMobileMenu() {
    elements.mobileMenu.classList.toggle('active');
}

// Handle Navigation Click
function handleNavClick(e) {
    const category = e.target.dataset.category;
    if (!category) return;
    
    AppState.currentCategory = category;
    AppState.filters.category = category;
    
    // Show hero section only on home (all category)
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.style.display = category === 'all' ? 'block' : 'none';
    }
    
    // Show/hide sections based on category
    showSectionsForCategory(category);
    
    // Apply translations after category change
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
    
    // Update filter dropdown
    if (elements.categoryFilter) {
        elements.categoryFilter.value = category;
    }
    
    // Update active state
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.category === category) {
            link.classList.add('active');
        }
    });
    
    // Close mobile menu
    elements.mobileMenu.classList.remove('active');
    
    // Load content based on category
    loadContentForCategory(category);
}

// Show/hide sections based on category
function showSectionsForCategory(category) {
    const allSections = document.querySelectorAll('.content-section');
    const sectionTitles = document.querySelectorAll('.section-title');
    
    // Section mappings: section data-type -> title (call t() at execution time, not definition)
    const sectionConfig = {
        'trending': { titleKey: 'trendingNow', show: ['all'] },
        'popular-movies': { titleKey: 'popularMovies', show: ['all', 'movie'] },
        'popular-tv': { titleKey: 'popularTvShows', show: ['all', 'tv'] },
        'toprated-movies': { titleKey: 'topRatedMovies', show: ['all', 'movie'] },
        'toprated-tv': { titleKey: 'topRatedTvShows', show: ['tv'] },
        'upcoming-movies': { titleKey: 'upcomingMovies', show: ['all', 'movie'] },
        'upcoming-tv': { titleKey: 'upcomingTvShows', show: ['tv'] },
        'on-tv': { titleKey: 'onTv', show: ['all', 'tv'] },
        'nowplaying-movies': { titleKey: 'nowPlaying', show: ['all', 'movie'] }
    };
    
    allSections.forEach(section => {
        const sectionType = section.dataset.section;
        const config = sectionConfig[sectionType];
        
        if (config && config.show.includes(category)) {
            section.style.display = 'block';
            // Update the title for this specific section using t() at execution time
            const titleEl = section.querySelector('.section-title');
            if (titleEl) {
                titleEl.textContent = t(config.titleKey);
            }
        } else {
            section.style.display = 'none';
        }
    });
}

// Load content for category
function loadContentForCategory(category) {
    if (category === 'favorites') {
        showFavorites();
        return;
    }
    
    // Don't show loading for search results
    if (AppState.searchQuery) {
        // Search is being handled separately
        return;
    }
    
    showLoading();
    
    // Load trending for home
    if (category === 'all' && AppState.cachedData.trending) {
        renderContent(elements.trendingContent, AppState.cachedData.trending);
    }
    
    // Load movie sections
    if (category === 'all' || category === 'movie') {
        loadMovieSections();
    }
    
    // Load TV sections
    if (category === 'all' || category === 'tv') {
        loadTvSections();
    }
    
    // Hide loading after content is loaded
    hideLoading();
}

// Load movie sections
async function loadMovieSections() {
    try {
        // Popular Movies
        const popularMoviesData = await fetchData(buildApiUrl(API_ENDPOINTS.popularMovies));
        renderContent(elements.moviesContent, popularMoviesData.results, 'movie');
        
        // Top Rated Movies
        const topratedMoviesData = await fetchData(buildApiUrl(API_ENDPOINTS.topRatedMovies));
        renderContent(elements.topratedContent, topratedMoviesData.results, 'movie');
        
        // Upcoming Movies
        const upcomingMoviesData = await fetchData(buildApiUrl(API_ENDPOINTS.upcomingMovies));
        renderContent(elements.upcomingContent, upcomingMoviesData.results, 'movie');
        
        // Now Playing
        const nowplayingData = await fetchData(buildApiUrl(API_ENDPOINTS.nowPlaying));
        renderContent(elements.nowplayingContent, nowplayingData.results, 'movie');
        
        hideLoading();
    } catch (error) {
        console.error('Error loading movie sections:', error);
        hideLoading();
    }
}

// Load TV sections
async function loadTvSections() {
    try {
        // Popular TV Shows
        const popularTvData = await fetchData(buildApiUrl(API_ENDPOINTS.popularTV));
        renderContent(elements.tvshowsContent, popularTvData.results, 'tv');
        
        // Top Rated TV Shows
        const topratedTvUrl = `${TMDB_CONFIG.BASE_URL}/tv/top_rated`;
        const topratedTvData = await fetchData(buildApiUrl(topratedTvUrl));
        renderContent(elements.topratedTvContent, topratedTvData.results, 'tv');
        
        // On TV (Airing Today)
        const ontvUrl = `${TMDB_CONFIG.BASE_URL}/tv/airing_today`;
        const ontvData = await fetchData(buildApiUrl(ontvUrl));
        renderContent(elements.ontvContent, ontvData.results, 'tv');
        
        // Upcoming TV Shows (On The Air - shows that are currently airing)
        const upcomingTvUrl = `${TMDB_CONFIG.BASE_URL}/tv/on_the_air`;
        const upcomingTvData = await fetchData(buildApiUrl(upcomingTvUrl));
        renderContent(elements.upcomingTvContent, upcomingTvData.results, 'tv');
        
        hideLoading();
    } catch (error) {
        console.error('Error loading TV sections:', error);
        hideLoading();
    }
}

// Handle Search
function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    AppState.searchQuery = query;
    searchContent(query);
}

// Search Content
async function searchContent(query) {
    showLoading();
    
    // Hide all sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    try {
        const url = buildApiUrl(API_ENDPOINTS.searchMulti, {
            query: query,
            page: 1
        });
        
        const data = await fetchData(url);
        displaySearchResults(data.results);
        
        // Scroll to results after displaying
        setTimeout(() => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display Search Results
function displaySearchResults(results) {
    const filteredResults = results.filter(item => 
        item.media_type === 'movie' || item.media_type === 'tv'
    );
    
    // Get search modal body
    const searchModalBody = document.getElementById('searchModalBody');
    const searchModal = document.getElementById('searchModal');
    
    if (!searchModalBody || !searchModal) {
        // Fallback to old method if modal doesn't exist
        displaySearchResultsOld(results);
        return;
    }
    
    // Show search modal
    searchModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (filteredResults.length > 0) {
        searchModalBody.innerHTML = `
            <div class="search-modal-grid">
                ${filteredResults.map(item => {
                    const card = createMovieCard(item);
                    return card.outerHTML;
                }).join('')}
            </div>
        `;
        
        // Add click handlers to search result cards
        setTimeout(() => {
            document.querySelectorAll('.search-modal-grid .movie-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.dataset.id;
                    const type = card.dataset.type;
                    if (id && type) {
                        // Close search modal first
                        searchModal.classList.remove('active');
                        document.body.style.overflow = '';
                        // Redirect to detail page
                        window.location.href = `detail.html?id=${id}&type=${type}`;
                    }
                });
            });
        }, 100);
    } else {
        searchModalBody.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Results Found</h3>
                <p>Try searching for something else</p>
            </div>
        `;
    }
    
    hideLoading();
}

// Fallback old display method
function displaySearchResultsOld(results) {
    const filteredResults = results.filter(item => 
        item.media_type === 'movie' || item.media_type === 'tv'
    );
    
    // Hide hero section during search
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.style.display = 'none';
    }
    
    // Create a single search results section
    const mainContent = document.querySelector('.main-content');
    
    // Remove any existing search results section
    const existingSearchSection = document.getElementById('searchResultsSection');
    if (existingSearchSection) {
        existingSearchSection.remove();
    }
    
    // Create search results section
    const searchSection = document.createElement('div');
    searchSection.id = 'searchResultsSection';
    searchSection.className = 'search-results';
    
    if (filteredResults.length > 0) {
        searchSection.innerHTML = `
            <div class="search-results-grid">
                ${filteredResults.map(item => {
                    const card = createMovieCard(item);
                    return card.outerHTML;
                }).join('')}
            </div>
        `;
    } else {
        searchSection.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Results Found</h3>
                <p>Try searching for something else</p>
            </div>
        `;
    }
    
    mainContent.appendChild(searchSection);
    
    // Add click handlers to the search result cards
    document.querySelectorAll('.search-results .movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const type = card.dataset.type;
            window.location.href = `detail.html?id=${id}&type=${type}`;
        });
    });
}

// Handle Filter Change
function handleFilterChange() {
    const category = elements.categoryFilter.value;
    const genre = elements.genreFilter.value;
    
    AppState.filters = {
        category: category,
        genre: genre,
        sortBy: 'popularity'
    };
    
    // Update navigation links
    AppState.currentCategory = category;
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.category === category) {
            link.classList.add('active');
        }
    });
    
    applyFilters();
}

// Apply Filters
async function applyFilters() {
    const { category } = AppState.filters;
    
    // Handle Favorites category
    if (category === 'favorites') {
        showFavorites();
        return;
    }
    
    showLoading();
    
    try {
        const { category, genre, sortBy } = AppState.filters;
        
        let url;
        
        // Determine effective category - if genre is selected, default to movie
        let effectiveCategory = category;
        if (genre && category === 'all') {
            effectiveCategory = 'movie';
        }
        
        if (effectiveCategory === 'movie') {
            url = buildApiUrl(API_ENDPOINTS.discoverMovies, {
                with_genres: genre || undefined,
                sort_by: getSortParameter(sortBy, 'movie')
            });
        } else if (effectiveCategory === 'tv') {
            url = buildApiUrl(API_ENDPOINTS.discoverTV, {
                with_genres: genre || undefined,
                sort_by: getSortParameter(sortBy, 'tv')
            });
        } else {
            // All content - show popular movies
            url = buildApiUrl(API_ENDPOINTS.popularMovies, {
                sort_by: getSortParameter(sortBy, 'movie')
            });
        }
        
        const data = await fetchData(url);
        
        // Update ALL content sections with filtered results
        const contentRows = document.querySelectorAll('.content-row');
        const sectionTitles = document.querySelectorAll('.section-title');
        
        // Update the first section title to show it's filtered (using translations)
        if (sectionTitles.length > 0) {
            let titleKey = 'popularMovies';
            if (effectiveCategory === 'tv') {
                titleKey = 'popularTvShows';
            } else if (effectiveCategory === 'all') {
                titleKey = 'popularMovies';
            }
            sectionTitles[0].textContent = t(titleKey);
        }
        
        // Clear and update all sections
        contentRows.forEach((contentRow, index) => {
            contentRow.innerHTML = '';
            
            // Add items to this row
            data.results.forEach(item => {
                contentRow.appendChild(createMovieCard({
                    ...item,
                    media_type: effectiveCategory === 'all' ? (item.media_type || 'movie') : effectiveCategory
                }));
            });
            
            // If no results
            if (data.results.length === 0) {
                contentRow.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-film"></i>
                        <h3>${t('noResults')}</h3>
                        <p>Try different filters</p>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Filter error:', error);
    } finally {
        hideLoading();
    }
}

// Show Favorites
function showFavorites(status = 'watching') {
    showLoading();
    
    const favorites = FavoritesManager.getAll();
    
    let displayItems = favorites[status] || [];
    
    // Apply translations
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
    
    // Hide hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.style.display = 'none';
    }
    
    // Show favorites section, hide others
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        if (section.dataset.section === 'favorites') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    // Update tab active state
    document.querySelectorAll('.favorites-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === status) {
            tab.classList.add('active');
        }
    });
    
    // If no tab is active (e.g., 'all' status), set the first tab as active
    if (!document.querySelector('.favorites-tab.active') && document.querySelector('.favorites-tab')) {
        document.querySelector('.favorites-tab').classList.add('active');
    }
    
    // Get favorites content row
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) {
        hideLoading();
        return;
    }
    
    favoritesContent.innerHTML = '';
    
    if (displayItems.length === 0) {
        favoritesContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>${t('noItemsInCategory')}</h3>
                <p>${t('addToYourList')}</p>
            </div>
        `;
    } else {
        displayItems.forEach(item => {
            favoritesContent.appendChild(createMovieCard(item));
        });
    }
    
    // Scroll to favorites section
    const favoritesSection = document.querySelector('.content-section[data-section="favorites"]');
    if (favoritesSection) {
        favoritesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    hideLoading();
}

// Initialize favorites tab click handlers
function initFavoritesTabs() {
    document.querySelectorAll('.favorites-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const status = tab.dataset.status;
            showFavorites(status);
        });
    });
}

// Get Sort Parameter
function getSortParameter(sortBy, type) {
    const sortMap = {
        'popularity': 'popularity.desc',
        'release_date': type === 'movie' ? 'release_date.desc' : 'first_air_date.desc',
        'rating': 'vote_average.desc',
        'trending': 'trending.desc'
    };
    return sortMap[sortBy] || sortMap.popularity;
}

// Load Initial Content
async function loadInitialContent() {
    showLoading();
    
    // Apply initial translations
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
    
    try {
        // Load all sections in parallel
        await Promise.all([
            loadTrendingContent(),
            loadMoviesContent(),
            loadTVShowsContent(),
            loadTopRatedContent(),
            loadUpcomingContent(),
            loadNowPlayingContent(),
            loadOnTVContent(),
            loadUpcomingTVContent()
        ]);
        
        // Set hero content after trending is loaded
        updateHeroContent();
    } catch (error) {
        console.error('Error loading content:', error);
        showError('Failed to load content. Please check your API key.');
    } finally {
        hideLoading();
    }
}

// Fetch Data
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Load Trending Content
async function loadTrendingContent() {
    const url = buildApiUrl(API_ENDPOINTS.trending, { page: 1 });
    const data = await fetchData(url);
    AppState.cachedData.trending = data.results;
    renderContent(elements.trendingContent, data.results);
}

// Load Movies Content
async function loadMoviesContent() {
    const url = buildApiUrl(API_ENDPOINTS.popularMovies, { page: 1 });
    const data = await fetchData(url);
    AppState.cachedData.movies = data.results;
    renderContent(elements.moviesContent, data.results, 'movie');
}

// Load TV Shows Content
async function loadTVShowsContent() {
    const url = buildApiUrl(API_ENDPOINTS.popularTV, { page: 1 });
    const data = await fetchData(url);
    AppState.cachedData.tvshows = data.results;
    renderContent(elements.tvshowsContent, data.results, 'tv');
}

// Load Top Rated Content
async function loadTopRatedContent() {
    const url = buildApiUrl(API_ENDPOINTS.topRatedMovies, { page: 1 });
    const data = await fetchData(url);
    AppState.cachedData.toprated = data.results;
    renderContent(elements.topratedContent, data.results, 'movie');
}

// Load Upcoming Content
async function loadUpcomingContent() {
    const url = buildApiUrl(API_ENDPOINTS.upcomingMovies, { page: 1 });
    const data = await fetchData(url);
    AppState.cachedData.upcoming = data.results;
    renderContent(elements.upcomingContent, data.results, 'movie');
}

// Load Now Playing Content
async function loadNowPlayingContent() {
    const url = buildApiUrl(API_ENDPOINTS.nowPlaying, { page: 1 });
    const data = await fetchData(url);
    AppState.cachedData.nowplaying = data.results;
    renderContent(elements.nowplayingContent, data.results, 'movie');
}

// Load On TV Content (Airing Today)
async function loadOnTVContent() {
    const url = `${TMDB_CONFIG.BASE_URL}/tv/airing_today`;
    const data = await fetchData(buildApiUrl(url, { page: 1 }));
    AppState.cachedData.ontv = data.results;
    renderContent(elements.ontvContent, data.results, 'tv');
}

// Load Upcoming TV Content (On The Air)
async function loadUpcomingTVContent() {
    const url = `${TMDB_CONFIG.BASE_URL}/tv/on_the_air`;
    const data = await fetchData(buildApiUrl(url, { page: 1 }));
    AppState.cachedData.upcomingTv = data.results;
    renderContent(elements.upcomingTvContent, data.results, 'tv');
}

// Render Content
function renderContent(container, items, defaultType = null) {
    if (!container) return;
    container.innerHTML = '';
    
    const displayItems = items.slice(0, 12);
    
    displayItems.forEach(item => {
        const card = createMovieCard(item, defaultType);
        container.appendChild(card);
    });
}

// Create Movie Card
function createMovieCard(item, defaultType = null) {
    const mediaType = item.media_type || defaultType || 'movie';
    const title = item.title || item.name || 'Untitled';
    const posterPath = item.poster_path;
    const backdropPath = item.backdrop_path;
    const releaseDate = item.release_date || item.first_air_date;
    const year = getYear(releaseDate);
    const rating = item.vote_average;
    const id = item.id;
    
    const card = document.createElement('div');
    card.className = 'movie-card fade-in';
    card.dataset.id = id;
    card.dataset.type = mediaType;
    
    card.innerHTML = `
        <div class="movie-card-image">
            <img src="${getPosterUrl(posterPath, 'medium')}" 
                 alt="${title}" 
                 loading="lazy"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 450%22%3E%3Crect fill=%22%231a1a1a%22 width=%22300%22 height=%22450%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            <div class="movie-card-overlay"></div>
            <div class="movie-card-play">
                <i class="fas fa-play"></i>
            </div>
            <span class="movie-card-quality">${getQualityBadge()}</span>
            <span class="movie-card-type">${mediaType === 'tv' ? 'TV Show' : 'Movie'}</span>
        </div>
        <div class="movie-card-info">
            <h3 class="movie-card-title">${title}</h3>
            <div class="movie-card-meta">
                <span class="movie-card-rating">
                    <i class="fas fa-star"></i>
                    ${formatRating(rating)}
                </span>
                <span class="movie-card-year">${year}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        // Navigate to detail page instead of showing modal
        window.location.href = `detail.html?id=${id}&type=${mediaType}`;
    });
    
    return card;
}

// Update Hero Content
function updateHeroContent(index) {
    const trending = AppState.cachedData.trending;
    if (!trending || trending.length === 0) return;
    
    // If no index provided, use current or default to 0
    if (typeof index === 'undefined') {
        index = AppState.heroIndex !== undefined ? AppState.heroIndex : 0;
    }
    
    // Wrap around the index
    if (index < 0) {
        index = trending.length - 1;
    }
    if (index >= trending.length) {
        index = 0;
    }
    
    // Save the current index
    AppState.heroIndex = index;
    
    const heroItem = trending[index];
    const backdropPath = heroItem.backdrop_path || heroItem.poster_path;
    const title = heroItem.title || heroItem.name || 'Trending Now';
    const overview = heroItem.overview || 'Watch the latest movies and TV shows online.';
    const mediaType = heroItem.media_type || (heroItem.title ? 'movie' : 'tv');
    
    // Get hero elements
    const heroSection = elements.heroSection;
    const heroTitle = elements.heroTitle;
    const heroDescription = elements.heroDescription;
    
    // Add fade out effect
    if (heroTitle && heroDescription) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(-20px)';
        heroDescription.style.opacity = '0';
        heroDescription.style.transform = 'translateY(20px)';
    }
    
    // After fade out, update content and fade in
    setTimeout(() => {
        // Update hero background
        if (heroSection) {
            heroSection.style.backgroundImage = `url(${getBackdropUrl(backdropPath, 'large')})`;
        }
        
        // Update hero text
        if (heroTitle) {
            heroTitle.textContent = title;
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }
        if (heroDescription) {
            heroDescription.textContent = overview.length > 200 
                ? overview.substring(0, 200) + '...' 
                : overview;
            heroDescription.style.opacity = '1';
            heroDescription.style.transform = 'translateY(0)';
        }
        
        // Update play and info buttons to work with current hero item
        const playBtn = document.getElementById('playBtn');
        const infoBtn = document.getElementById('infoBtn');
        
        if (playBtn) {
            playBtn.onclick = () => {
                window.location.href = `detail.html?id=${heroItem.id}&type=${mediaType}`;
            };
        }
        
        if (infoBtn) {
            infoBtn.onclick = () => {
                window.location.href = `detail.html?id=${heroItem.id}&type=${mediaType}`;
            };
        }
    }, 400);
}

// Open Detail Modal
async function openDetailModal(item) {
    showLoading();
    
    try {
        const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
        const detailsUrl = mediaType === 'movie' 
            ? API_ENDPOINTS.movieDetails(item.id)
            : API_ENDPOINTS.tvDetails(item.id);
        
        const creditsUrl = mediaType === 'movie'
            ? API_ENDPOINTS.movieCredits(item.id)
            : API_ENDPOINTS.tvCredits(item.id);
        
        const [detailsData, creditsData] = await Promise.all([
            fetchData(buildApiUrl(detailsUrl)),
            fetchData(buildApiUrl(creditsUrl))
        ]);
        
        renderDetailModal(detailsData, creditsData, mediaType);
        elements.detailModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading details:', error);
        showError('Failed to load details.');
    } finally {
        hideLoading();
    }
}

// Render Detail Modal
function renderDetailModal(details, credits, mediaType) {
    const title = details.title || details.name;
    const backdropPath = details.backdrop_path || details.poster_path;
    const posterPath = details.poster_path;
    const tagline = details.tagline;
    const overview = details.overview;
    const releaseDate = details.release_date || details.first_air_date;
    const rating = details.vote_average;
    const runtime = details.runtime || details.episode_run_time?.[0];
    const genres = details.genres?.map(g => g.name).join(', ') || 'N/A';
    const status = details.status;
    const budget = details.budget;
    const revenue = details.revenue;
    
    // Get directors and writers
    const directors = credits.crew?.filter(c => c.job === 'Director').slice(0, 3) || [];
    const writers = credits.crew?.filter(c => 
        c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story'
    ).slice(0, 3) || [];
    
    // Get cast
    const cast = credits.cast?.slice(0, 8) || [];
    
    const modalHTML = `
        <div class="detail-backdrop" style="background-image: url('${getBackdropUrl(backdropPath, 'large')}')">
            <div class="detail-content">
                <div class="detail-header">
                    <div class="detail-poster">
                        <img src="${getPosterUrl(posterPath, 'large')}" alt="${title}">
                    </div>
                    <div class="detail-info">
                        <h1 class="detail-title">${title}</h1>
                        <div class="detail-meta">
                            <span><i class="fas fa-calendar"></i> ${formatDate(releaseDate)}</span>
                            <span><i class="fas fa-star"></i> ${formatRating(rating)}</span>
                            <span><i class="fas fa-clock"></i> ${formatRuntime(runtime)}</span>
                            <span><i class="fas fa-circle"></i> ${status}</span>
                        </div>
                        ${tagline ? `<p class="detail-tagline">"${tagline}"</p>` : ''}
                        <p class="detail-overview">${overview || 'No overview available.'}</p>
                        <div class="detail-actions">
                            <button class="detail-btn detail-btn-primary">
                                <i class="fas fa-play"></i> Watch Now
                            </button>
                            <button class="detail-btn detail-btn-secondary">
                                <i class="fas fa-plus"></i> Add to List
                            </button>
                        </div>
                        <div class="detail-stats">
                            <div class="detail-stat">
                                <div class="detail-stat-value">${genres}</div>
                                <div class="detail-stat-label">Genres</div>
                            </div>
                            ${budget ? `
                            <div class="detail-stat">
                                <div class="detail-stat-value">$${budget.toLocaleString()}</div>
                                <div class="detail-stat-label">Budget</div>
                            </div>
                            ` : ''}
                            ${revenue ? `
                            <div class="detail-stat">
                                <div class="detail-stat-value">$${revenue.toLocaleString()}</div>
                                <div class="detail-stat-label">Revenue</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${directors.length > 0 || writers.length > 0 ? `
                <div class="detail-section">
                    <h3 class="detail-section-title">Crew</h3>
                    <div class="detail-crew">
                        ${directors.map(person => `
                            <div class="crew-member">
                                <img src="${person.profile_path ? getPosterUrl(person.profile_path, 'small') : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22%3E%3Crect fill=%22%23333%22 width=%2280%22 height=%2280%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EDirector%3C/text%3E%3C/svg%3E'}" alt="${person.name}">
                                <div class="crew-member-name">${person.name}</div>
                                <div class="crew-member-role">Director</div>
                            </div>
                        `).join('')}
                        ${writers.map(person => `
                            <div class="crew-member">
                                <img src="${person.profile_path ? getPosterUrl(person.profile_path, 'small') : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22%3E%3Crect fill=%22%23333%22 width=%2280%22 height=%2280%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EWriter%3C/text%3E%3C/svg%3E'}" alt="${person.name}">
                                <div class="crew-member-name">${person.name}</div>
                                <div class="crew-member-role">${person.job}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${cast.length > 0 ? `
                <div class="detail-section">
                    <h3 class="detail-section-title">Cast / Crew</h3>
                    <div class="detail-crew">
                        ${cast.map(person => `
                            <div class="crew-member">
                                <img src="${person.profile_path ? getPosterUrl(person.profile_path, 'small') : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22%3E%3Crect fill=%22%23333%22 width=%2280%22 height=%2280%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3EActor%3C/text%3E%3C/svg%3E'}" alt="${person.name}">
                                <div class="crew-member-name">${person.name}</div>
                                <div class="crew-member-role">${person.character}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    elements.modalBody.innerHTML = modalHTML;
    
    // Add event listeners to buttons
    const watchBtn = elements.modalBody.querySelector('.detail-btn-primary');
    if (watchBtn) {
        watchBtn.addEventListener('click', () => {
            alert(`Playing: ${title}\n\nNote: This is a demo. In production, this would open a video player.`);
        });
    }
    
    const addBtn = elements.modalBody.querySelector('.detail-btn-secondary');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            alert(`${title} added to your watchlist!`);
        });
    }
}

// Close Modal
function closeModal() {
    elements.detailModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Show Loading
function showLoading() {
    elements.loading.classList.add('active');
}

// Hide Loading
function hideLoading() {
    elements.loading.classList.remove('active');
}

// Show Error
function showError(message) {
    console.error(message);
}
