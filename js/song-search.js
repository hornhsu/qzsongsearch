// Global variables
let songsData = [];
let filteredSongs = [];

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resetButton = document.getElementById('resetButton');
const singerFilter = document.getElementById('singerFilter');
const yearFilter = document.getElementById('yearFilter');
const genreFilter = document.getElementById('genreFilter');
const resultCount = document.getElementById('resultCount');
const resultsContainer = document.getElementById('resultsContainer');
const noResults = document.getElementById('noResults');

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch and parse the CSV data
        // const response = await fetch('../g歌单.csv');
        const response = await fetch('songlist.csv');
        //const response = await fetch('https://raw.githubusercontent.com/hornhsu/qzsongsearch/refs/heads/main/songlist.csv');
        const csvText = await response.text();
        
        // Parse CSV data and skip the header row
        songsData = parseCSV(csvText);
        
        // Initialize filters
        populateFilters();
        
        // Display all songs initially
        filteredSongs = [...songsData];
        displayResults();
        
        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error loading song data:', error);
        alert('錯誤無法載入歌曲數據，請稍後再試。');
    }
});

// Parse CSV text to array of song objects
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    
    // Skip the header row and empty lines
    return lines.slice(1)
        .filter(line => line.trim().length > 0)
        .map(line => {
            const [song, singer, year, genre, duration] = line.split(',');
            return {
                song: song.trim(),
                singer: singer.trim(),
                year: year.trim(),
                genre: genre.trim(),
                duration: duration.trim()
            };
        });
}

// Populate filter dropdowns with unique values
function populateFilters() {
    const singers = new Set();
    const years = new Set();
    const genres = new Set();
    
    songsData.forEach(song => {
        singers.add(song.singer);
        years.add(song.year);
        
        // Split genre field by '/' for multi-genre songs
        const songGenres = song.genre.split('/');
        songGenres.forEach(g => genres.add(g.trim()));
    });
    
    // Sort values alphabetically/numerically
    populateSelect(singerFilter, [...singers].sort());
    populateSelect(yearFilter, [...years].sort((a, b) => b - a)); // Years in descending order
    populateSelect(genreFilter, [...genres].sort());
}

// Add options to a select element
function populateSelect(selectElement, options) {
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        optElement.textContent = option;
        selectElement.appendChild(optElement);
    });
}

// Set up event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', applyFilters);
    resetButton.addEventListener('click', resetFilters);
    searchInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') applyFilters();
    });
    
    // Add change listeners to dropdown filters for immediate filtering
    singerFilter.addEventListener('change', applyFilters);
    yearFilter.addEventListener('change', applyFilters);
    genreFilter.addEventListener('change', applyFilters);
}

// Apply all filters and search
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSinger = singerFilter.value;
    const selectedYear = yearFilter.value;
    const selectedGenre = genreFilter.value;
    
    filteredSongs = songsData.filter(song => {
        // Apply search term filter
        const matchesSearch = searchTerm === '' || 
            song.song.toLowerCase().includes(searchTerm) || 
            song.singer.toLowerCase().includes(searchTerm);
        
        // Apply dropdown filters
        const matchesSinger = selectedSinger === '' || song.singer === selectedSinger;
        const matchesYear = selectedYear === '' || song.year === selectedYear;
        const matchesGenre = selectedGenre === '' || song.genre.includes(selectedGenre);
        
        return matchesSearch && matchesSinger && matchesYear && matchesGenre;
    });
    
    displayResults();
}

// Reset all filters and show all results
function resetFilters() {
    searchInput.value = '';
    singerFilter.value = '';
    yearFilter.value = '';
    genreFilter.value = '';
    
    filteredSongs = [...songsData];
    displayResults();
}

// Display the filtered results as cards
function displayResults() {
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Update result count
    resultCount.textContent = filteredSongs.length;
    
    // Show or hide the no results message
    if (filteredSongs.length === 0) {
        noResults.style.display = 'flex';
        noResults.style.flexDirection = 'column';
        noResults.style.alignItems = 'center';
        resultsContainer.style.display = 'none';
    } else {
        noResults.style.display = 'none';
        resultsContainer.style.display = 'flex';
        
        // Add each song as a card
        filteredSongs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            
            // Get the first genre if there are multiple
            const primaryGenre = song.genre.split('/')[0].trim();
            
            card.innerHTML = `
                <div class="song-info">
                    <h3 class="song-title">${song.song}</h3>
                    <div class="song-artist">${song.singer}</div>
                </div>
                <div class="song-meta-container">
                    <div class="song-meta">${song.year}</div>
                    <div class="song-genre">${primaryGenre}</div>
                    <div class="song-duration">${song.duration}</div>
                </div>
            `;
            
            resultsContainer.appendChild(card);
        });
    }
}
