document.addEventListener('DOMContentLoaded', function() {
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
        })
        .catch(error => {
            console.error('Error fetching or parsing CSV data:', error);
            document.getElementById('noResults').classList.remove('hidden');
            document.getElementById('noResults').innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>無法載入歌曲資料。請檢查網路連接或重新整理頁面。</p>
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
        filterType.innerHTML = '<option value="all">所有類型</option>';
        Array.from(genres).sort().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            filterType.appendChild(option);
        });
        
        // Populate decade filter
        const filterYear = document.getElementById('filterYear');
        filterYear.innerHTML = '<option value="all">所有年代</option>';
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
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGenre = filterType.value;
        const selectedDecade = filterYear.value;
        const selectedArtist = filterArtist.value;
        
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
    }
    
    function displaySongs(songs) {
        const songContainer = document.getElementById('songContainer');
        const noResults = document.getElementById('noResults');
        const resultsCount = document.getElementById('resultsCount');
        
        songContainer.innerHTML = '';
        
        if (songs.length === 0) {
            noResults.classList.remove('hidden');
            resultsCount.textContent = '沒有找到符合條件的歌曲';
            return;
        }
        
        noResults.classList.add('hidden');
        resultsCount.textContent = `顯示 ${songs.length} 首歌曲`;
        
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
                        <p class="song-artist">${artist}</p>
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
                            <p class="song-artist">${artist}</p>
                            <div class="song-meta-bottom">
                                <span>${genre}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            songContainer.appendChild(songCard);
            
            // Add click event listener to copy song info
            songCard.addEventListener('click', function() {
                const songTitle = song['歌曲'] || '';
                const artist = song['歌手'] || '';
                const textToCopy = `${songTitle} - ${artist}`;
                
                // Copy to clipboard
                copyToClipboard(textToCopy);
                
                // Show notification
                showCopyNotification(textToCopy);
            });
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
        textDisplay.textContent = `已複製: ${text}`;
        
        // Show the notification
        notification.classList.add('show');
        
        // Hide the notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});
