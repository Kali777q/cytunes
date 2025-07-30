// admin.js - Secure Admin Dashboard for MelodyCloud
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-content');
    const sectionTitles = {
        upload: 'Upload Music 🎶',
        manage: 'Manage Tracks 🎼'
    };

    // Show default section
    document.getElementById('upload-section').classList.remove('hidden');

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show selected section
            sections.forEach(sec => sec.classList.add('hidden'));
            const showSection = document.getElementById(`${section}-section`);
            if (showSection) showSection.classList.remove('hidden');
            
            // Update header title
            document.getElementById('admin-section-title').textContent = 
                sectionTitles[section] || 'Admin Dashboard';
        });
    });

    // Secure file upload form
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form
            const title = document.getElementById('song-title').value.trim();
            const artist = document.getElementById('artist-name').value.trim();
            const audioFile = document.getElementById('audio-file').files[0];
            
            if (!title || !artist || !audioFile) {
                showStatus('Please fill all required fields', 'error');
                return;
            }

            showStatus('Uploading...', 'info');
            
            try {
                const formData = new FormData(uploadForm);
                const response = await fetch(uploadForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showStatus('Upload successful!', 'success');
                    uploadForm.reset();
                    document.getElementById('audio-file-info').textContent = 'No file selected';
                    document.getElementById('cover-file-info').textContent = 'No file selected';
                    // Always refresh track list in admin
                    loadTracksTable();
                    // If on index page, refresh there too
                    if (window.loadTrackList) window.loadTrackList();
                    // Switch to manage section
                    document.querySelectorAll('.admin-content').forEach(sec => sec.classList.add('hidden'));
                    document.getElementById('manage-section').classList.remove('hidden');
                    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
                    document.querySelector('.nav-item[data-section="manage"]').classList.add('active');
                    document.getElementById('admin-section-title').textContent = 'Manage Tracks 🎼';
                } else {
                    showStatus(result.error || 'Upload failed', 'error');
                }
            } catch (err) {
                showStatus('Network error. Please try again.', 'error');
                console.error('Upload error:', err);
            }
        });
    }

    // File input validation
    const validateFile = (file, allowedTypes, maxSize, typeName) => {
        if (!file) return false;
        
        if (file.size > maxSize) {
            showNotification(`${typeName} must be less than ${maxSize/1024/1024}MB`, 'error');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            showNotification(`Invalid ${typeName} format. Allowed: ${allowedTypes.join(', ')}`, 'error');
            return false;
        }
        
        return true;
    };

    document.getElementById('audio-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const isValid = validateFile(file, ['audio/mpeg'], 10 * 1024 * 1024, 'Audio file');
        
        if (!isValid) {
            this.value = '';
            document.getElementById('audio-file-info').textContent = 'No file selected';
        } else {
            document.getElementById('audio-file-info').textContent = file.name;
        }
    });

    document.getElementById('cover-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const isValid = validateFile(file, ['image/jpeg', 'image/png'], 2 * 1024 * 1024, 'Cover image');
        
        if (!isValid) {
            this.value = '';
            document.getElementById('cover-file-info').textContent = 'No file selected';
        } else {
            document.getElementById('cover-file-info').textContent = file.name;
        }
    });

    // Helper function to show status messages
    function showStatus(message, type) {
        const statusContent = uploadStatus.querySelector('.status-content');
        statusContent.innerHTML = `<p class="${type}">${escapeHtml(message)}</p>`;
    }

    // Basic HTML escaping
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});

// Track management variables
let currentPage = 1;
const tracksPerPage = 10;
let allTracks = [];
let filteredTracks = [];

// Load tracks for management table
async function loadTracksTable() {
    try {
        const tableBody = document.getElementById('tracks-table-body');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-tracks">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading tracks...</p>
                </td>
            </tr>
        `;

        const response = await fetch('assets/music/tracks.json');
        if (!response.ok) throw new Error('Failed to load tracks');
        
        allTracks = await response.json();
        filteredTracks = [...allTracks];
        
        renderTracksTable();
        setupSearch();
        setupPagination();
    } catch (error) {
        console.error('Error loading tracks:', error);
        const tableBody = document.getElementById('tracks-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5">Error loading tracks. Please try again.</td></tr>';
        }
    }
}

function renderTracksTable() {
    const tableBody = document.getElementById('tracks-table-body');
    const startIndex = (currentPage - 1) * tracksPerPage;
    const paginatedTracks = filteredTracks.slice(startIndex, startIndex + tracksPerPage);
    
    if (paginatedTracks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No tracks found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = paginatedTracks.map((track, index) => `
        <tr data-id="${track.id}">
            <td><img src="${escapeHtml(track.cover || 'assets/images/default-cover.png')}" alt="Cover" class="track-cover"></td>
            <td>${escapeHtml(track.title || 'Untitled')}</td>
            <td>${escapeHtml(track.artist || 'Unknown')}</td>
            <td>${escapeHtml(track.upload_date || 'N/A')}</td>
            <td class="track-actions">
                <button class="action-btn edit" data-id="${track.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${track.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update pagination info
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = Math.ceil(filteredTracks.length / tracksPerPage);
    
    // Enable/disable pagination buttons
    document.getElementById('prev-page').classList.toggle('disabled', currentPage === 1);
    document.getElementById('next-page').classList.toggle('disabled', currentPage >= Math.ceil(filteredTracks.length / tracksPerPage));
    
    // Add event listeners for action buttons
    setupActionButtons();
}

function setupSearch() {
    const searchInput = document.getElementById('track-search');
    const searchBtn = document.getElementById('search-btn');
    
    const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredTracks = allTracks.filter(track => 
                (track.title && track.title.toLowerCase().includes(searchTerm)) || 
                (track.artist && track.artist.toLowerCase().includes(searchTerm))
            );
        } else {
            filteredTracks = [...allTracks];
        }
        currentPage = 1;
        renderTracksTable();
    };
    
    searchInput.addEventListener('input', performSearch);
    searchBtn.addEventListener('click', performSearch);
}

function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTracksTable();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < Math.ceil(filteredTracks.length / tracksPerPage)) {
            currentPage++;
            renderTracksTable();
        }
    });
}

function setupActionButtons() {
    // Add event listeners for delete buttons
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', handleDeleteTrack);
    });
    
    // Add event listeners for edit buttons
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', handleEditTrack);
    });
}

// Handle track deletion
function handleDeleteTrack(e) {
    const trackId = e.currentTarget.getAttribute('data-id');
    const track = filteredTracks.find(t => t.id === trackId);
    if (!track) return;
    
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('hidden');
    
    document.getElementById('cancel-delete').onclick = () => {
        modal.classList.add('hidden');
    };
    
    document.getElementById('confirm-delete').onclick = async () => {
        try {
            const response = await fetch('includes/delete_track.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    track_id: trackId
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Track deleted successfully', 'success');
                loadTracksTable();
            } else {
                showNotification(result.message || 'Failed to delete track', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            modal.classList.add('hidden');
        }
    };
}

function handleEditTrack(e) {
    const trackIndex = parseInt(e.currentTarget.getAttribute('data-id'));
    const track = filteredTracks[trackIndex];
    
    if (!track) return;
    
    // For now, just show a notification
    showNotification('Edit functionality coming soon!', 'info');
}

// Helper function for notifications
function showNotification(message, type) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <p>${message}</p>
        <button class="close-notification">&times;</button>
    `;
    
    container.appendChild(notification);
    
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}
