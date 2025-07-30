// player.js - Enhanced audio player with better error handling and UI updates
let currentTrack = 0;
let tracks = [];
let audio = null;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isDraggingProgress = false;

// Load tracks from JSON
async function loadTrackList() {
    try {
        const songGrid = document.getElementById('song-grid');
        songGrid.innerHTML = `
            <div class="loading-tracks">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading music library...</p>
            </div>
        `;

        const response = await fetch('assets/music/tracks.json');
        if (!response.ok) throw new Error('Failed to load tracks');
        
        tracks = await response.json();
        if (tracks.length > 0) {
            renderSongGrid(tracks);
            loadTrack(currentTrack);
        } else {
            throw new Error('No tracks found');
        }
    } catch (error) {
        console.error('Error loading tracks:', error);
        document.getElementById('song-grid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load music library. Please try again later.</p>
            </div>
        `;
    }
}

function loadTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    
    currentTrack = index;
    const track = tracks[index];
    
    // Clear previous audio
    if (audio) {
        audio.pause();
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleTrackEnd);
        audio = null;
    }
    
    audio = new Audio(track.url);
    audio.preload = 'metadata';
    
    // Update UI
    document.querySelector('.album-cover').src = track.cover || 'assets/images/default-cover.png';
    document.querySelector('.song-title').textContent = track.title;
    document.querySelector('.song-artist').textContent = track.artist;
    
    // Highlight current song in grid
    document.querySelectorAll('.song-card').forEach((card, i) => {
        card.classList.toggle('playing', i === currentTrack && isPlaying);
    });
    
    // Metadata loaded
    audio.addEventListener('loadedmetadata', () => {
        document.querySelector('.duration').textContent = formatTime(audio.duration);
    });
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('error', handleAudioError);
    
    if (isPlaying) {
        audio.play().catch(e => {
            console.error('Playback failed:', e);
            handleAudioError();
        });
    }
}

function handleAudioError() {
    console.error('Error with audio playback');
    document.querySelector('.song-title').textContent = 'Error playing track';
    document.querySelector('.song-artist').textContent = 'Please try another song';
}

function handleTrackEnd() {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextTrack();
    }
}

function updateProgress() {
    if (!audio || isDraggingProgress) return;
    
    const progress = (audio.currentTime / audio.duration) * 100;
    document.querySelector('.progress').style.width = `${progress}%`;
    document.querySelector('.current-time').textContent = formatTime(audio.currentTime);
    // Enhanced: update progress bar in song card
    const songCard = document.querySelector(`.song-card[data-index="${currentTrack}"] .progress`);
    if (songCard) {
        songCard.style.width = `${progress}%`;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function playPause() {
    if (!audio) return;
    
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(e => {
            console.error('Playback failed:', e);
            handleAudioError();
        });
    }
    isPlaying = !isPlaying;
    updatePlayButton();
    
    // Update playing state in song grid
    document.querySelectorAll('.song-card').forEach((card, i) => {
        card.classList.toggle('playing', i === currentTrack && isPlaying);
    });
}

function updatePlayButton() {
    const playBtn = document.querySelector('.play-btn i');
    if (playBtn) {
        playBtn.classList.toggle('fa-play', !isPlaying);
        playBtn.classList.toggle('fa-pause', isPlaying);
    }
}

function nextTrack() {
    if (tracks.length === 0) return;
    
    if (isShuffle) {
        let next;
        do {
            next = Math.floor(Math.random() * tracks.length);
        } while (next === currentTrack && tracks.length > 1);
        loadTrack(next);
    } else {
        loadTrack((currentTrack + 1) % tracks.length);
    }
    if (isPlaying) {
        audio.play().catch(e => console.error('Playback failed:', e));
    }
}

function prevTrack() {
    if (!audio) return;
    
    if (audio.currentTime > 3) {
        // If more than 3 seconds into song, restart it
        audio.currentTime = 0;
    } else {
        // Otherwise go to previous track
        loadTrack((currentTrack - 1 + tracks.length) % tracks.length);
        if (isPlaying) {
            audio.play().catch(e => console.error('Playback failed:', e));
        }
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.querySelector('.shuffle-btn').classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    document.querySelector('.repeat-btn').classList.toggle('active', isRepeat);
}

function renderSongGrid(tracks) {
    const grid = document.getElementById('song-grid');
    if (!grid) return;
    if (tracks.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-music"></i>
                <p>No songs found</p>
            </div>
        `;
        return;
    }
    grid.innerHTML = tracks.map((track, i) => `
        <div class="song-card${i === currentTrack && isPlaying ? ' playing' : ''}" data-index="${i}">
            <img src="${track.cover || 'assets/images/default-cover.png'}" alt="${track.title}" class="song-cover${i === currentTrack ? ' animated-album' : ''}">
            <div class="song-title">${track.title}</div>
            <div class="song-artist">${track.artist}</div>
            <div class="song-actions">
                <button class="play-song-btn" data-index="${i}" aria-label="Play ${track.title}">
                    <i class="fas ${i === currentTrack && isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <a href="${track.url}" download="${track.title} - ${track.artist}.mp3" class="download-btn">
                    <i class="fas fa-download"></i>
                </a>
            </div>
            <div class="progress-bar song-progress-bar${i === currentTrack ? ' active' : ''}">
                <div class="progress" style="width: ${i === currentTrack ? ((audio && audio.duration) ? (audio.currentTime / audio.duration * 100) : 0) : 0}%"></div>
            </div>
        </div>
    `).join('');
    // Add event listeners to play buttons
    grid.querySelectorAll('.play-song-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            if (index === currentTrack && isPlaying) {
                playPause();
            } else {
                loadTrack(index);
                isPlaying = true;
                updatePlayButton();
                audio.play().catch(e => {
                    console.error('Playback failed:', e);
                    handleAudioError();
                });
            }
        });
    });
    // Add visual effect for track change
    grid.querySelectorAll('.song-card').forEach((card, i) => {
        if (i === currentTrack) {
            card.classList.add('highlight-track');
            setTimeout(() => card.classList.remove('highlight-track'), 600);
        }
    });
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load tracks
    loadTrackList();
    
    // Player controls
    document.querySelector('.play-btn').addEventListener('click', playPause);
    document.querySelector('.prev-btn').addEventListener('click', prevTrack);
    document.querySelector('.next-btn').addEventListener('click', nextTrack);
    document.querySelector('.shuffle-btn').addEventListener('click', toggleShuffle);
    document.querySelector('.repeat-btn').addEventListener('click', toggleRepeat);
    
    // Progress bar interaction
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (!audio) return;
            const rect = e.target.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audio.currentTime = pos * audio.duration;
        });
        
        // Add drag support for progress bar
        progressBar.addEventListener('mousedown', () => {
            isDraggingProgress = true;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDraggingProgress && audio) {
                const rect = progressBar.getBoundingClientRect();
                const pos = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                audio.currentTime = pos * audio.duration;
                document.querySelector('.progress').style.width = `${pos * 100}%`;
                document.querySelector('.current-time').textContent = formatTime(audio.currentTime);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDraggingProgress = false;
        });
    }
    
    // Volume control
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (audio) audio.volume = e.target.value / 100;
        });
        volumeSlider.value = 80; // Default volume
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            playPause();
        } else if (e.code === 'ArrowRight') {
            nextTrack();
        } else if (e.code === 'ArrowLeft') {
            prevTrack();
        }
    });
});
