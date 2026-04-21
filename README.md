# StreamX - Modern Streaming Website

A modern streaming website replica inspired by popular streaming platforms. Features movies, TV shows, anime, and more with a sleek dark UI design.

## Setup

1. **Get a TMDB API Key:**
   - Go to https://www.themoviedb.org/
   - Create a free account
   - Go to Settings > API
   - For "Application URL", use: `http://localhost`
   - Generate your API key

2. **Add Your API Key:**
   Open `config.js` and replace the placeholder with your actual API key:
   ```javascript
   API_KEY: 'YOUR_ACTUAL_TMDB_API_KEY_HERE',
   ```

3. **Run the Project:**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   Then open http://localhost:8000

   Or use VS Code Live Server extension.

## Features

- 🎬 Browse movies and TV shows
- 🔍 Search functionality
- 🎯 Genre and category filtering
- 📱 Fully responsive design
- 📋 Movie/TV show detail modals
