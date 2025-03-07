document.addEventListener('DOMContentLoaded', function() {
    // Theme handling - detect system preference and apply theme
    function initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const storedTheme = localStorage.getItem('theme');
        
        // Set initial theme based on local storage or system preference
        if (storedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        } else if (storedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.checked = false;
        } else if (prefersDarkScheme.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }
        
        // Add event listener for theme toggle
        themeToggle.addEventListener('change', function(e) {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
        
        // Listen for system preference changes
        prefersDarkScheme.addEventListener('change', (e) => {
            // If no user preference is stored, update according to system preference
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    themeToggle.checked = true;
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    themeToggle.checked = false;
                }
            }
        });
    }

    // Initialize theme
    initTheme();
    
    // Create popup element and add to body
    const artistPopup = document.createElement('div');
    artistPopup.className = 'artist-popup';
    artistPopup.innerHTML = `
        <div class="artist-popup-header"></div>
        <div class="artist-popup-options">
            <div class="artist-popup-option" id="filterByArtistOption">
                <i class="fas fa-filter"></i>
                <span>只显示此歌手歌曲</span>
            </div>
            <div class="artist-popup-option" id="copyArtistOption">
                <i class="fas fa-copy"></i>
                <span>复制歌手名称</span>
            </div>
        </div>
    `;
    document.body.appendChild(artistPopup);
    
    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.artist-clickable') && !e.target.closest('.artist-popup')) {
            artistPopup.classList.remove('show');
        }
    });
    
    // Add event listeners to popup options
    document.getElementById('filterByArtistOption').addEventListener('click', function() {
        const artistName = artistPopup.getAttribute('data-artist');
        if (artistName) {
            // Get the artist dropdown and set its value
            const artistDropdown = document.getElementById('filterArtist');
            artistDropdown.value = artistName;
            
            // Create a change event to trigger the filter
            const event = new Event('change');
            artistDropdown.dispatchEvent(event);
            
            // Show a tooltip notification
            showFilterNotification(`已筛选: ${artistName}`);
            
            // Hide the popup
            artistPopup.classList.remove('show');
        }
    });
    
    document.getElementById('copyArtistOption').addEventListener('click', function() {
        const artistName = artistPopup.getAttribute('data-artist');
        if (artistName) {
            // Copy to clipboard
            copyToClipboard(artistName);
            
            // Show notification
            showCopyNotification(`已复制: ${artistName}`);
            
            // Hide the popup
            artistPopup.classList.remove('show');
        }
    });
    
    // Fetch CSV data from file
    fetch('songlist.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(csvData => {
            // Parse CSV into array of song objects
            const songs = parseCSV(csvData);
            
            // Cache DOM elements
            const searchInput = document.getElementById('searchInput');
            const searchButton = document.getElementById('searchButton');
            const songContainer = document.getElementById('songContainer');
            const filterType = document.getElementById('filterType');
            const filterYear = document.getElementById('filterYear');
            const filterArtist = document.getElementById('filterArtist');
            const resultsCount = document.getElementById('resultsCount');
            const noResults = document.getElementById('noResults');
            const gridViewBtn = document.getElementById('gridView');
            const listViewBtn = document.getElementById('listView');
            const clearFiltersBtn = document.getElementById('clearFilters');
            
            // Populate filter dropdowns
            populateFilters(songs);
            
            // Initial display of all songs
            displaySongs(songs);
            
            // Add event listeners
            searchButton.addEventListener('click', () => performSearch(songs));
            searchInput.addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    performSearch(songs);
                }
            });
            
            filterType.addEventListener('change', () => performSearch(songs));
            filterYear.addEventListener('change', () => performSearch(songs));
            filterArtist.addEventListener('change', () => performSearch(songs));
            
            gridViewBtn.addEventListener('click', function() {
                songContainer.className = 'grid-view';
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
                displaySongs(filterSongs(songs)); // Redisplay with current filters
            });
            
            listViewBtn.addEventListener('click', function() {
                songContainer.className = 'list-view';
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
                displaySongs(filterSongs(songs)); // Redisplay with current filters
            });
            
            // Add event listener to clear filters button
            clearFiltersBtn.addEventListener('click', function() {
                // Reset all filters
                document.getElementById('searchInput').value = '';
                document.getElementById('filterType').value = 'all';
                document.getElementById('filterYear').value = 'all';
                document.getElementById('filterArtist').value = 'all';
                
                // Hide the clear filters button
                clearFiltersBtn.classList.add('hidden');
                
                // Perform search with cleared filters
                performSearch(songs);
                
                // Show notification
                showFilterNotification('已清除所有筛选条件');
            });
        })
        .catch(error => {
            console.error('Error fetching or parsing CSV data:', error);
            document.getElementById('noResults').classList.remove('hidden');
            document.getElementById('noResults').innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>无法加载歌曲数据。请检查网络连接或刷新页面。</p>
            `;
        });
    
    // Functions
    function parseCSV(csvText) {
        const lines = csvText.split('\n');
        // Trim headers to remove any whitespace or invisible characters
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Log headers to help debugging
        console.log("CSV Headers:", headers);
        
        return lines.slice(1).filter(line => line.trim() !== '').map(line => {
            const values = line.split(',');
            const song = {};
            
            headers.forEach((header, index) => {
                song[header] = values[index];
            });
            
            // Debug a sample song object
            if (lines.indexOf(line) === 1) {
                console.log("Sample song object:", song);
            }
            
            return song;
        });
    }
    
    function populateFilters(songs) {
        // Get unique genres
        const genres = new Set();
        songs.forEach(song => {
            // Support both traditional and simplified Chinese field names
            const genreField = song['類型'] || song['类型'];
            if (genreField) {
                const genresList = genreField.split('/');
                genresList.forEach(genre => genres.add(genre.trim()));
            }
        });
        
        // Get decades from years
        const decades = new Set();
        songs.forEach(song => {
            // Support both traditional and simplified Chinese field names
            const yearField = song['年分'];
            if (yearField) {
                const year = parseInt(yearField);
                const decade = Math.floor(year / 10) * 10;
                decades.add(decade);
            }
        });
        
        // Get unique artists
        const artists = new Set();
        songs.forEach(song => {
            // Support both traditional and simplified Chinese field names
            const artistField = song['歌手'];
            if (artistField) {
                artists.add(artistField);
            }
        });
        
        // Populate genre filter
        const filterType = document.getElementById('filterType');
        filterType.innerHTML = '<option value="all">所有类型</option>';
        Array.from(genres).sort().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            filterType.appendChild(option);
        });
        
        // Populate decade filter
        const filterYear = document.getElementById('filterYear');
        filterYear.innerHTML = '<option value="all">所有年份</option>';
        Array.from(decades).sort((a, b) => b - a).forEach(decade => {
            const option = document.createElement('option');
            option.value = decade;
            option.textContent = `${decade}年代`;
            filterYear.appendChild(option);
        });
        
        // Populate artist filter
        const filterArtist = document.getElementById('filterArtist');
        filterArtist.innerHTML = '<option value="all">所有歌手</option>';
        Array.from(artists).sort().forEach(artist => {
            const option = document.createElement('option');
            option.value = artist;
            option.textContent = artist;
            filterArtist.appendChild(option);
        });
    }
    
    function filterSongs(songs) {
        const searchInput = document.getElementById('searchInput');
        const filterType = document.getElementById('filterType');
        const filterYear = document.getElementById('filterYear');
        const filterArtist = document.getElementById('filterArtist');
        const clearFiltersBtn = document.getElementById('clearFilters');
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGenre = filterType.value;
        const selectedDecade = filterYear.value;
        const selectedArtist = filterArtist.value;
        
        // Show or hide the clear filters button based on whether any filters are active
        if (searchTerm !== '' || selectedGenre !== 'all' || 
            selectedDecade !== 'all' || selectedArtist !== 'all') {
            clearFiltersBtn.classList.remove('hidden');
        } else {
            clearFiltersBtn.classList.add('hidden');
        }
        
        return songs.filter(song => {
            // Search term matching with support for both field naming conventions
            const songTitle = song['歌曲'];
            const artist = song['歌手'];
            const year = song['年分'];
            const genre = song['類型'] || song['类型'];
            
            const matchesSearch = searchTerm === '' || 
                (songTitle && songTitle.toLowerCase().includes(searchTerm)) || 
                (artist && artist.toLowerCase().includes(searchTerm)) || 
                (year && year.includes(searchTerm)) ||
                (genre && genre.toLowerCase().includes(searchTerm));
            
            // Genre filter with support for both field naming conventions
            const matchesGenre = selectedGenre === 'all' || 
                (genre && genre.includes(selectedGenre));
            
            // Decade filter
            const matchesDecade = selectedDecade === 'all' || 
                (parseInt(year) >= parseInt(selectedDecade) && 
                parseInt(year) < parseInt(selectedDecade) + 10);
            
            // Artist filter
            const matchesArtist = selectedArtist === 'all' || artist === selectedArtist;
            
            return matchesSearch && matchesGenre && matchesDecade && matchesArtist;
        });
    }
    
    function performSearch(songs) {
        const filteredSongs = filterSongs(songs);
        displaySongs(filteredSongs);
        
        // Scroll to the top of the page after filtering
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    function displaySongs(songs) {
        const songContainer = document.getElementById('songContainer');
        const noResults = document.getElementById('noResults');
        const resultsCount = document.getElementById('resultsCount');
        
        songContainer.innerHTML = '';
        
        if (songs.length === 0) {
            noResults.classList.remove('hidden');
            resultsCount.textContent = '没有找到符合条件的歌曲';
            return;
        }
        
        noResults.classList.add('hidden');
        resultsCount.textContent = `显示 ${songs.length} 首歌曲`;
        
        // Generate colors for cards based on song genre
        const genreColors = {
            '流行': '#6c5ce7',
            'R&B': '#e84393',
            '民谣': '#00b894',
            'indie': '#0984e3',
            '摇滚': '#d63031',
            '爵士': '#fdcb6e',
            '中国风': '#e17055',
            '古风': '#e17055', // Added color for 古风 genre
            '粤语流行': '#00cec9',
            '电影原声': '#74b9ff',
            '乡村': '#55efc4',
            '民族': '#a29bfe',
        };
        
        songs.forEach(song => {
            // For debugging
            if (songs.indexOf(song) === 0) {
                console.log("First song keys:", Object.keys(song));
            }
            
            const songCard = document.createElement('div');
            songCard.className = 'song-card';
            
            // Get appropriate field values with fallbacks
            const songTitle = song['歌曲'] || '';
            const artist = song['歌手'] || '';
            const year = song['年分'] || '';
            const genre = song['類型'] || song['类型'] || '';
            
            // Determine card color based on genre
            const mainGenre = genre.split('/')[0];
            const cardColor = genreColors[mainGenre] || '#6c5ce7';
            
            // Create card for grid view
            if (songContainer.className === 'grid-view') {
                songCard.innerHTML = `
                    <div class="card-image" style="background-color: ${cardColor}">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="card-content">
                        <h3 class="song-title">${songTitle}</h3>
                        <p class="song-artist artist-clickable" data-artist="${artist}">${artist}</p>
                        <div class="song-details">
                            <span>${year}</span>
                        </div>
                    </div>
                    <span class="song-genre">${genre}</span>
                `;
            } else {
                // Create list item for list view with restructured layout
                songCard.innerHTML = `
                    <div class="card-image" style="background-color: ${cardColor}">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="card-content">
                        <div class="song-row">
                            <h3 class="song-title">${songTitle}</h3>
                            <div class="song-meta-top">
                                <span>${year}</span>
                            </div>
                        </div>
                        <div class="song-row">
                            <p class="song-artist artist-clickable" data-artist="${artist}">${artist}</p>
                            <div class="song-meta-bottom">
                                <span>${genre}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            songContainer.appendChild(songCard);
            
            // Add click event listener to copy song info (on the entire card except artist name)
            songCard.addEventListener('click', function(e) {
                // Don't copy if clicking on the artist name
                if (e.target.closest('.artist-clickable')) {
                    return;
                }
                
                const songTitle = song['歌曲'] || '';
                const artist = song['歌手'] || '';
                const textToCopy = `${songTitle} - ${artist}`;
                
                // Copy to clipboard
                copyToClipboard(textToCopy);
                
                // Show notification
                showCopyNotification(textToCopy);
            });
            
            // Update the click event for the artist name
            const artistElement = songCard.querySelector('.artist-clickable');
            if (artistElement) {
                artistElement.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent the card's click event from firing
                    
                    const clickedArtist = this.getAttribute('data-artist');
                    const artistPopup = document.querySelector('.artist-popup');
                    
                    // Update popup content
                    const popupHeader = artistPopup.querySelector('.artist-popup-header');
                    popupHeader.textContent = clickedArtist;
                    
                    // Store the artist name as a data attribute
                    artistPopup.setAttribute('data-artist', clickedArtist);
                    
                    // Position popup near the click
                    const rect = this.getBoundingClientRect();
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    
                    // Check if there's enough space below
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const popupHeight = 110; // Approximate height of popup
                    
                    if (spaceBelow < popupHeight) {
                        // Position above if not enough space below
                        artistPopup.style.top = `${rect.top + scrollTop - popupHeight - 5}px`;
                    } else {
                        // Position below
                        artistPopup.style.top = `${rect.bottom + scrollTop + 5}px`;
                    }
                    
                    artistPopup.style.left = `${rect.left}px`;
                    
                    // Show the popup
                    artistPopup.classList.add('show');
                });
            }
        });
    }
    
    // Function to copy text to clipboard
    function copyToClipboard(text) {
        // Create a temporary textarea element to copy from
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        // Select and copy the text
        textarea.select();
        document.execCommand('copy');
        
        // Clean up
        document.body.removeChild(textarea);
    }
    
    // Function to show and hide notification
    function showCopyNotification(text) {
        const notification = document.getElementById('copyNotification');
        const textDisplay = document.getElementById('copiedTextDisplay');
        
        // Update the notification text
        textDisplay.textContent = `已复制: ${text}`;
        
        // Show the notification
        notification.classList.add('show');
        
        // Hide the notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Function to show filter notification
    function showFilterNotification(text) {
        const notification = document.getElementById('copyNotification');
        const textDisplay = document.getElementById('copiedTextDisplay');
        
        // Update the notification text
        textDisplay.textContent = text;
        
        // Add filter icon
        const icon = notification.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-filter';
        }
        
        // Show the notification
        notification.classList.add('show');
        
        // Hide the notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            // Reset icon back to clipboard icon
            if (icon) {
                icon.className = 'fas fa-clipboard-check';
            }
        }, 3000);
    }
});
