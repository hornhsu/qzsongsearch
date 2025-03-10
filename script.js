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
    
    // Set up sort button and popup interactions
    const sortButton = document.getElementById('sortButton');
    const sortPopup = document.getElementById('sortPopup');
    let currentSortOption = 'default';
    
    // Show sort popup when clicking the sort button
    sortButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const rect = sortButton.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
        // Position popup below the sort button
        sortPopup.style.top = `${rect.bottom + scrollTop + 5}px`;
        sortPopup.style.left = `${rect.left - sortPopup.offsetWidth + rect.width}px`;
        
        // Toggle popup visibility
        if (sortPopup.classList.contains('show')) {
            sortPopup.classList.remove('show');
            sortButton.classList.remove('active');
        } else {
            sortPopup.classList.add('show');
            sortButton.classList.add('active');
            
            // Highlight the current sort option
            highlightActiveSortOption();
        }
    });
    
    // Close sort popup when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#sortButton') && !e.target.closest('#sortPopup')) {
            sortPopup.classList.remove('show');
            sortButton.classList.remove('active');
        }
    });
    
    // Add event listeners to sort options
    document.querySelectorAll('.sort-popup-option').forEach(option => {
        option.addEventListener('click', function() {
            const sortValue = this.getAttribute('data-sort');
            currentSortOption = sortValue;
            
            // Update UI to show selected sort option
            highlightActiveSortOption();
            
            // Close the popup
            sortPopup.classList.remove('show');
            sortButton.classList.remove('active');
            
            // If sort button has a badge, show sort icon, otherwise show default icon
            updateSortButtonIcon();
            
            // Perform sort
            if (window.originalSongs) {
                performSearch(window.originalSongs);
            }
        });
    });
    
    // Function to highlight the active sort option
    function highlightActiveSortOption() {
        document.querySelectorAll('.sort-popup-option').forEach(opt => {
            if (opt.getAttribute('data-sort') === currentSortOption) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }
    
    // Function to update sort button icon based on current selection
    function updateSortButtonIcon() {
        const iconElement = sortButton.querySelector('i');
        
        if (currentSortOption === 'default') {
            iconElement.className = 'fas fa-sort';
            sortButton.classList.remove('active'); // Normal color when no sorting
        } else {
            // Keep button highlighted when sorting is active
            sortButton.classList.add('active');
            
            // Set appropriate icon based on sort type
            switch(currentSortOption) {
                case 'title-asc':
                case 'artist-asc':
                    iconElement.className = 'fas fa-sort-alpha-down';
                    break;
                case 'title-desc':
                case 'artist-desc':
                    iconElement.className = 'fas fa-sort-alpha-down-alt';
                    break;
                case 'year-desc':
                    iconElement.className = 'fas fa-sort-numeric-down-alt';
                    break;
                case 'year-asc':
                    iconElement.className = 'fas fa-sort-numeric-down';
                    break;
                default:
                    iconElement.className = 'fas fa-sort';
            }
        }
    }
    
    // Add debounce function to delay search execution
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

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
            
            // Store original order of songs for default sorting
            const originalSongs = [...songs];
            window.originalSongs = originalSongs; // Store in window object for access from sort functions
            
            // Cache DOM elements
            const searchInput = document.getElementById('searchInput');
            const searchButton = document.getElementById('searchButton');
            const songContainer = document.getElementById('songContainer');
            const filterType = document.getElementById('filterType');
            const filterYear = document.getElementById('filterYear');
            const filterArtist = document.getElementById('filterArtist');
            // Remove reference to non-existent sortOptions element
            const resultsCount = document.getElementById('resultsCount');
            const noResults = document.getElementById('noResults');
            const gridViewBtn = document.getElementById('gridView');
            const listViewBtn = document.getElementById('listView');
            const clearFiltersBtn = document.getElementById('clearFilters');
            
            // Populate filter dropdowns
            populateFilters(songs);
            
            // Initial display of all songs
            displaySongs(songs);
            
            // Create debounced search function with 300ms delay
            const debouncedSearch = debounce(() => performSearch(originalSongs), 300);
            
            // Add event listeners
            searchButton.addEventListener('click', () => performSearch(originalSongs));
            
            // Add real-time search on input
            searchInput.addEventListener('input', debouncedSearch);
            
            // Keep the keyup event for Enter key
            searchInput.addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    performSearch(originalSongs);
                }
            });
            
            // Convert standard select elements to multi-select 
            setupMultiSelect('filterType');
            setupMultiSelect('filterYear');
            setupMultiSelect('filterArtist');
            
            gridViewBtn.addEventListener('click', function() {
                songContainer.className = 'grid-view';
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
                displaySongs(filterAndSortSongs(originalSongs)); // Redisplay with current filters and sort
            });
            
            listViewBtn.addEventListener('click', function() {
                songContainer.className = 'list-view';
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
                displaySongs(filterAndSortSongs(originalSongs)); // Redisplay with current filters and sort
            });
            
            // Add event listener to clear filters button
            clearFiltersBtn.addEventListener('click', function() {
                // Reset search input
                document.getElementById('searchInput').value = '';
                
                // Reset multi-select filters
                resetMultiSelect('filterType');
                resetMultiSelect('filterYear');
                resetMultiSelect('filterArtist');
                
                // Reset sorting to default
                currentSortOption = 'default';
                updateSortButtonIcon();
                highlightActiveSortOption();
                
                // Hide the clear filters button
                clearFiltersBtn.classList.add('hidden');
                
                // Perform search with cleared filters
                performSearch(originalSongs);
                
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
        
        // Get unique artists - split by "/" to handle multiple artists per song
        const artists = new Set();
        songs.forEach(song => {
            // Support both traditional and simplified Chinese field names
            const artistField = song['歌手'];
            if (artistField) {
                // Split artist field by "/" and add each individual artist
                const artistList = artistField.split('/');
                artistList.forEach(artist => artists.add(artist.trim()));
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
        const filterTypeInput = document.getElementById('filterType'); // Now a hidden input
        const filterYearInput = document.getElementById('filterYear'); // Now a hidden input
        const filterArtistInput = document.getElementById('filterArtist'); // Now a hidden input
        const clearFiltersBtn = document.getElementById('clearFilters');
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedTypes = filterTypeInput.value.split(',');
        const selectedYears = filterYearInput.value.split(',');
        const selectedArtists = filterArtistInput.value.split(',');
        
        // Show or hide the clear filters button based on whether any filters are active
        if (searchTerm !== '' || 
            !selectedTypes.includes('all') || 
            !selectedYears.includes('all') || 
            !selectedArtists.includes('all') ||
            currentSortOption !== 'default') {
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
            
            // Genre filter with support for multi-select
            const matchesGenre = selectedTypes.includes('all') || 
                (genre && selectedTypes.some(type => genre.includes(type)));
            
            // Year filter with support for multi-select
            const matchesYear = selectedYears.includes('all') || 
                selectedYears.some(decadeStr => {
                    const decade = parseInt(decadeStr);
                    return parseInt(year) >= decade && parseInt(year) < decade + 10;
                });
            
            // Artist filter with support for multi-select
            // Handle multiple artists per song (separated by "/")
            const matchesArtist = selectedArtists.includes('all') || 
                (artist && artist.split('/').some(individualArtist => 
                    selectedArtists.includes(individualArtist.trim())
                ));
            
            return matchesSearch && matchesGenre && matchesYear && matchesArtist;
        });
    }
    
    // New function to handle both filtering and sorting
    function filterAndSortSongs(songs) {
        const filteredSongs = filterSongs(songs);
        return sortSongs(filteredSongs);
    }
    
    // New function to sort songs based on selected option
    function sortSongs(songs) {        
        if (currentSortOption === 'default') {
            return songs; // Return songs in original order
        }
        
        const sortedSongs = [...songs]; // Create a copy to sort
        
        switch (currentSortOption) {
            case 'title-asc':
                sortedSongs.sort((a, b) => {
                    const titleA = a['歌曲'] || '';
                    const titleB = b['歌曲'] || '';
                    return titleA.localeCompare(titleB, 'zh');
                });
                break;
                
            case 'title-desc':
                sortedSongs.sort((a, b) => {
                    const titleA = a['歌曲'] || '';
                    const titleB = b['歌曲'] || '';
                    return titleB.localeCompare(titleA, 'zh');
                });
                break;
                
            case 'artist-asc':
                sortedSongs.sort((a, b) => {
                    const artistA = a['歌手'] || '';
                    const artistB = b['歌手'] || '';
                    return artistA.localeCompare(artistB, 'zh');
                });
                break;
                
            case 'artist-desc':
                sortedSongs.sort((a, b) => {
                    const artistA = a['歌手'] || '';
                    const artistB = b['歌手'] || '';
                    return artistB.localeCompare(artistA, 'zh');
                });
                break;
                
            case 'year-asc':
                sortedSongs.sort((a, b) => {
                    const yearA = parseInt(a['年分'] || '0');
                    const yearB = parseInt(b['年分'] || '0');
                    return yearA - yearB;
                });
                break;
                
            case 'year-desc':
                sortedSongs.sort((a, b) => {
                    const yearA = parseInt(a['年分'] || '0');
                    const yearB = parseInt(b['年分'] || '0');
                    return yearB - yearA;
                });
                break;
        }
        
        return sortedSongs;
    }
    
    function performSearch(originalSongs) {
        const filteredAndSortedSongs = filterAndSortSongs(originalSongs);
        displaySongs(filteredAndSortedSongs);
        
        // Hide the random song container when filters change
        document.getElementById('randomSongContainer').classList.add('hidden');
        
        // Show sort info in results count if sorting is active
        if (currentSortOption !== 'default') {
            // Find the text of the selected sort option
            const sortOptionElement = document.querySelector(`.sort-popup-option[data-sort="${currentSortOption}"]`);
            if (sortOptionElement) {
                const sortText = sortOptionElement.querySelector('span').textContent;
                const resultsCount = document.getElementById('resultsCount');
                resultsCount.textContent = `${filteredAndSortedSongs.length} 首 (${sortText})`;
            }
        }
        
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
        resultsCount.textContent = ` ${songs.length} 首`;
        
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
            
            // Determine card color based on genre - now for the icon color instead of background
            const mainGenre = genre.split('/')[0];
            const iconColor = genreColors[mainGenre] || '#6c5ce7';
            
            // Create card for grid view
            if (songContainer.className === 'grid-view') {
                // For artists with "/", handle each individually
                const artistHtml = artist.includes('/') ?
                    artist.split('/').map(a => 
                        `<span class="artist-clickable" data-artist="${a.trim()}">${a.trim()}</span>`
                    ).join(' / ') :
                    `<span class="artist-clickable" data-artist="${artist}">${artist}</span>`;
                
                songCard.innerHTML = `
                    <div class="card-image">
                        <!-- Removed music icon, keeping empty space for future image replacement -->
                    </div>
                    <div class="card-content">
                        <h3 class="song-title">${songTitle}</h3>
                        <p class="song-artist">${artistHtml}</p>
                        <div class="song-details">
                            <span>${year}</span>
                        </div>
                    </div>
                    <span class="song-genre" style="background-color: ${iconColor}">${genre}</span>
                `;
            } else {
                // For list view with multiple artists
                const artistHtml = artist.includes('/') ?
                    artist.split('/').map(a => 
                        `<span class="artist-clickable" data-artist="${a.trim()}">${a.trim()}</span>`
                    ).join(' / ') :
                    `<span class="artist-clickable" data-artist="${artist}">${artist}</span>`;
                
                songCard.innerHTML = `
                    <div class="card-image">
                        <i class="fas fa-music" style="color: ${iconColor}"></i>
                    </div>
                    <div class="card-content">
                        <div class="song-row">
                            <h3 class="song-title">${songTitle}</h3>
                            <div class="song-meta-top">
                                <span>${year}</span>
                            </div>
                        </div>
                        <div class="song-row">
                            <p class="song-artist">${artistHtml}</p>
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
            
            // Update click events for all artist elements instead of just the first one
            const artistElements = songCard.querySelectorAll('.artist-clickable');
            if (artistElements.length > 0) {
                artistElements.forEach(artistElement => {
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
                        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
                        
                        // Get window dimensions and popup size
                        const windowWidth = window.innerWidth;
                        const windowHeight = window.innerHeight;
                        const popupHeight = 110; // Approximate height of popup
                        const popupWidth = 180; // Approximate min width of popup
                        
                        // Calculate available space
                        const spaceBelow = windowHeight - rect.bottom;
                        const spaceRight = windowWidth - rect.left;
                        
                        // Position vertically - above or below based on available space
                        if (spaceBelow < popupHeight) {
                            // Position above if not enough space below
                            artistPopup.style.top = `${rect.top + scrollTop - popupHeight - 5}px`;
                        } else {
                            // Position below
                            artistPopup.style.top = `${rect.bottom + scrollTop + 5}px`;
                        }
                        
                        // Position horizontally - adjust if too close to right edge
                        if (spaceRight < popupWidth) {
                            // Position from right edge of window instead of left edge of clicked element
                            const rightPosition = Math.max(10, rect.right - popupWidth);
                            artistPopup.style.left = `${rightPosition + scrollLeft}px`;
                        } else {
                            // Normal positioning
                            artistPopup.style.left = `${rect.left + scrollLeft}px`;
                        }
                        
                        // Show the popup
                        artistPopup.classList.add('show');
                    });
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
    
    // Functions for multi-select implementation
    function setupMultiSelect(filterId) {
        const originalSelect = document.getElementById(filterId);
        if (!originalSelect) return;
        
        // Create container
        const container = document.createElement('div');
        container.className = 'multi-select-container';
        container.id = `${filterId}Container`;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'multi-select-header';
        header.innerHTML = `
            <span>所有${getFilterLabel(filterId)}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'multi-select-dropdown';
        
        // Add search box for artist filter (since it can have many options)
        if (filterId === 'filterArtist') {
            const search = document.createElement('input');
            search.type = 'text';
            search.className = 'multi-select-search';
            search.placeholder = '搜索歌手...';
            search.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const options = dropdown.querySelectorAll('.multi-select-option:not(.all-option)');
                
                options.forEach(option => {
                    const text = option.querySelector('span').textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        option.style.display = 'flex';
                    } else {
                        option.style.display = 'none';
                    }
                });
            });
            dropdown.appendChild(search);
        }
        
        // Create "All" option
        const allOption = document.createElement('div');
        allOption.className = 'multi-select-option all-option selected';
        allOption.setAttribute('data-value', 'all');
        allOption.innerHTML = `
            <span>所有${getFilterLabel(filterId)}</span>
            <i class="fas fa-check"></i>
        `;
        dropdown.appendChild(allOption);
        
        // Create options from original select
        Array.from(originalSelect.options).forEach(option => {
            if (option.value === 'all') return; // Skip the "all" option
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'multi-select-option';
            optionDiv.setAttribute('data-value', option.value);
            optionDiv.innerHTML = `
                <span>${option.textContent}</span>
                <i class="fas fa-check"></i>
            `;
            dropdown.appendChild(optionDiv);
        });
        
        // Add click events
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown(filterId);
        });
        
        dropdown.querySelectorAll('.multi-select-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleOption(this, filterId);
                updateFilterDisplay(filterId);
                performSearch(window.originalSongs);
            });
        });
        
        // Add components
        container.appendChild(header);
        container.appendChild(dropdown);
        
        // Replace original select
        originalSelect.parentNode.replaceChild(container, originalSelect);
        
        // Create hidden input to store values
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = filterId;
        hiddenInput.value = 'all';
        document.body.appendChild(hiddenInput);
    }
    
    function toggleDropdown(filterId) {
        // Close all other dropdowns
        document.querySelectorAll('.multi-select-dropdown').forEach(dropdown => {
            if (dropdown.parentNode.id !== `${filterId}Container` && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                const icon = dropdown.parentNode.querySelector('.multi-select-header i');
                icon.className = 'fas fa-chevron-down';
            }
        });
        
        // Toggle current dropdown
        const container = document.getElementById(`${filterId}Container`);
        const dropdown = container.querySelector('.multi-select-dropdown');
        const icon = container.querySelector('.multi-select-header i');
        
        dropdown.classList.toggle('show');
        
        if (dropdown.classList.contains('show')) {
            icon.className = 'fas fa-chevron-up';
            
            // Focus search if it exists
            const search = dropdown.querySelector('.multi-select-search');
            if (search) {
                setTimeout(() => search.focus(), 50);
            }
        } else {
            icon.className = 'fas fa-chevron-down';
        }
    }
    
    function toggleOption(option, filterId) {
        const allOption = option.parentNode.querySelector('.all-option');
        const isAllOption = option.classList.contains('all-option');
        const hiddenInput = document.getElementById(filterId);
        
        if (isAllOption) {
            // Select only "All" option
            option.parentNode.querySelectorAll('.multi-select-option').forEach(opt => {
                if (opt === allOption) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
            hiddenInput.value = 'all';
            return;
        }
        
        // Toggle clicked option
        option.classList.toggle('selected');
        
        // Check if any specific options are selected
        const selectedOptions = Array.from(option.parentNode.querySelectorAll('.multi-select-option:not(.all-option).selected'));
        
        if (selectedOptions.length === 0) {
            // If no specific options, select "All"
            allOption.classList.add('selected');
            hiddenInput.value = 'all';
        } else {
            // If specific options selected, deselect "All"
            allOption.classList.remove('selected');
            // Update hidden input value
            hiddenInput.value = selectedOptions
                .map(opt => opt.getAttribute('data-value'))
                .join(',');
        }
    }
    
    function updateFilterDisplay(filterId) {
        const container = document.getElementById(`${filterId}Container`);
        const headerText = container.querySelector('.multi-select-header span');
        const selectedOptions = container.querySelectorAll('.multi-select-option.selected');
        const allOption = container.querySelector('.all-option');
        
        if (allOption.classList.contains('selected')) {
            headerText.textContent = `所有${getFilterLabel(filterId)}`;
        } else {
            headerText.textContent = `已选 ${selectedOptions.length} 项`;
        }
    }
    
    function resetMultiSelect(filterId) {
        const container = document.getElementById(`${filterId}Container`);
        if (!container) return;
        
        const allOption = container.querySelector('.all-option');
        const headerText = container.querySelector('.multi-select-header span');
        const hiddenInput = document.getElementById(filterId);
        
        // Select only "All" option
        container.querySelectorAll('.multi-select-option').forEach(opt => {
            if (opt === allOption) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
        
        // Reset header text
        headerText.textContent = `所有${getFilterLabel(filterId)}`;
        
        // Reset hidden input
        hiddenInput.value = 'all';
    }
    
    function getFilterLabel(filterId) {
        switch(filterId) {
            case 'filterType': return '类型';
            case 'filterYear': return '年份';
            case 'filterArtist': return '歌手';
            default: return '';
        }
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.multi-select-dropdown').forEach(dropdown => {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                const icon = dropdown.parentNode.querySelector('.multi-select-header i');
                icon.className = 'fas fa-chevron-down';
            }
        });
    });

    // Add random button functionality
    const randomButton = document.getElementById('randomButton');
    if (randomButton) {
        randomButton.addEventListener('click', function() {
            selectRandomSong();
        });
    }

    // Function to select a random song from currently displayed songs
    function selectRandomSong() {
        // Get all currently displayed songs
        const songCards = document.querySelectorAll('#songContainer .song-card');
        
        if (songCards.length === 0) {
            showFilterNotification('没有可供选择的歌曲');
            return;
        }
        
        // Select a random song
        const randomIndex = Math.floor(Math.random() * songCards.length);
        const selectedSong = songCards[randomIndex];
        
        // Get song details from the selected card
        const songTitle = selectedSong.querySelector('.song-title').textContent;
        const songArtistElement = selectedSong.querySelector('.song-artist');
        const songArtist = songArtistElement.textContent;
        
        // Get year and genre
        let year = '';
        let genre = '';
        
        // Check if we're in list view or grid view
        if (document.getElementById('songContainer').classList.contains('list-view')) {
            // List view
            year = selectedSong.querySelector('.song-meta-top span')?.textContent || '';
            genre = selectedSong.querySelector('.song-meta-bottom span')?.textContent || '';
        } else {
            // Grid view
            year = selectedSong.querySelector('.song-details span')?.textContent || '';
            genre = selectedSong.querySelector('.song-genre')?.textContent || '';
        }
        
        // Get the color of the icon/genre tag for consistent color coding
        let iconColor = '#6c5ce7'; // Default color
        const iconElement = selectedSong.querySelector('.card-image i');
        const genreElement = selectedSong.querySelector('.song-genre');
        
        if (iconElement && iconElement.style.color) {
            iconColor = iconElement.style.color;
        } else if (genreElement && genreElement.style.backgroundColor) {
            iconColor = genreElement.style.backgroundColor;
        }
        
        // Create a HTML for the random song card with consistent layout
        const randomSongContainer = document.getElementById('randomSongContainer');
        
        // Format the artist HTML correctly for clickable artists
        const artistHtml = songArtistElement.innerHTML;
        
        randomSongContainer.innerHTML = `
            <button class="random-close-btn" title="关闭">
                <i class="fas fa-times"></i>
            </button>
            <div class="song-card">
                <div class="card-image">
                    <i class="fas fa-music" style="color: ${iconColor}; font-size: 2rem;"></i>
                </div>
                <div class="card-content">
                    <div class="song-row">
                        <h3 class="song-title">${songTitle}</h3>
                        <div class="song-year">${year}</div>
                    </div>
                    <p class="song-artist">${artistHtml}</p>
                    <div class="song-genre-tag">${genre}</div>
                </div>
            </div>
        `;
        randomSongContainer.classList.remove('hidden');
        
        // Add click event to the close button
        const closeButton = randomSongContainer.querySelector('.random-close-btn');
        closeButton.addEventListener('click', function(e) {
            e.stopPropagation();
            randomSongContainer.classList.add('hidden');
        });
        
        // Add click handler to the random song card
        const randomSongCard = randomSongContainer.querySelector('.song-card');
        randomSongCard.addEventListener('click', function(e) {
            // Don't copy if clicking on the artist name or close button
            if (e.target.closest('.artist-clickable') || e.target.closest('.random-close-btn')) {
                return;
            }
            
            const textToCopy = `${songTitle} - ${songArtist}`;
            copyToClipboard(textToCopy);
            showCopyNotification(textToCopy);
        });
        
        // Add artist click handlers to the cloned song
        const artistElements = randomSongContainer.querySelectorAll('.artist-clickable');
        if (artistElements.length > 0) {
            artistElements.forEach(artistElement => {
                artistElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
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
                    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
                    
                    // Get window dimensions and popup size
                    const windowWidth = window.innerWidth;
                    const windowHeight = window.innerHeight;
                    const popupHeight = 110; // Approximate height of popup
                    const popupWidth = 180; // Approximate min width of popup
                    
                    // Calculate available space
                    const spaceBelow = windowHeight - rect.bottom;
                    const spaceRight = windowWidth - rect.left;
                    
                    // Position vertically - above or below based on available space
                    if (spaceBelow < popupHeight) {
                        artistPopup.style.top = `${rect.top + scrollTop - popupHeight - 5}px`;
                    } else {
                        artistPopup.style.top = `${rect.bottom + scrollTop + 5}px`;
                    }
                    
                    // Position horizontally - adjust if too close to right edge
                    if (spaceRight < popupWidth) {
                        const rightPosition = Math.max(10, rect.right - popupWidth);
                        artistPopup.style.left = `${rightPosition + scrollLeft}px`;
                    } else {
                        artistPopup.style.left = `${rect.left + scrollLeft}px`;
                    }
                    
                    // Show the popup
                    artistPopup.classList.add('show');
                });
            });
        }
        
        // Show notification
        showFilterNotification(`随机抽选: ${songTitle} - ${songArtist}`);
        
        // Scroll to top to show the random result
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});
