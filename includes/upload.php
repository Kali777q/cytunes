<?php
session_start([
    'cookie_secure' => true,
    'cookie_httponly' => true
]);

// Authentication check
if (!isset($_SESSION['admin_logged_in'])) {
    http_response_code(403);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Unauthorized']));
}

// Validate session consistency
if ($_SESSION['ip_address'] !== $_SERVER['REMOTE_ADDR'] || 
    $_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
    session_destroy();
    http_response_code(403);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Session invalid']));
}

// File upload configuration
$maxMp3Size = 10 * 1024 * 1024; // 10MB
$maxImgSize = 2 * 1024 * 1024;  // 2MB
$uploadDir = __DIR__ . '/../assets/uploads/';
$allowedMp3Types = ['audio/mpeg'];
$allowedImgTypes = ['image/jpeg', 'image/png'];

// Create upload directories if they don't exist
foreach (['music', 'covers'] as $dir) {
    if (!file_exists($uploadDir . $dir)) {
        mkdir($uploadDir . $dir, 0755, true);
    }
}

// Validate file uploads
if (!isset($_FILES['track']) || $_FILES['track']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    die(json_encode(['error' => 'Audio file is required']));
}

// Process audio file
$audioFile = $_FILES['track'];
$audioInfo = finfo_open(FILEINFO_MIME_TYPE);
$audioMime = finfo_file($audioInfo, $audioFile['tmp_name']);
finfo_close($audioInfo);

if (!in_array($audioMime, $allowedMp3Types)) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid audio file type. Only MP3 allowed.']));
}

if ($audioFile['size'] > $maxMp3Size) {
    http_response_code(400);
    die(json_encode(['error' => 'Audio file must be less than 10MB']));
}

// Process cover image (optional)
$coverFile = null;
$coverMime = null;
$coverName = null;

if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
    $coverFile = $_FILES['cover'];
    $coverInfo = finfo_open(FILEINFO_MIME_TYPE);
    $coverMime = finfo_file($coverInfo, $coverFile['tmp_name']);
    finfo_close($coverInfo);

    if (!in_array($coverMime, $allowedImgTypes)) {
        http_response_code(400);
        die(json_encode(['error' => 'Invalid cover image type. Only JPG/PNG allowed.']));
    }

    if ($coverFile['size'] > $maxImgSize) {
        http_response_code(400);
        die(json_encode(['error' => 'Cover image must be less than 2MB']));
    }
}

// Generate unique filenames
$trackName = uniqid('track_', true) . '.mp3';
$trackPath = $uploadDir . 'music/' . $trackName;

// Move uploaded audio file
if (!move_uploaded_file($audioFile['tmp_name'], $trackPath)) {
    http_response_code(500);
    die(json_encode(['error' => 'Failed to save audio file']));
}

// Process cover image if provided
if ($coverFile) {
    $coverExt = $coverMime === 'image/jpeg' ? '.jpg' : '.png';
    $coverName = uniqid('cover_', true) . $coverExt;
    $coverPath = $uploadDir . 'covers/' . $coverName;

    if (!move_uploaded_file($coverFile['tmp_name'], $coverPath)) {
        unlink($trackPath); // Clean up audio file
        http_response_code(500);
        die(json_encode(['error' => 'Failed to save cover image']));
    }
} else {
    // Use default cover if none provided
    $coverName = 'default-cover.png';
}

// Sanitize input data
$title = filter_input(INPUT_POST, 'title', FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
$artist = filter_input(INPUT_POST, 'artist', FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
$description = filter_input(INPUT_POST, 'song_description', FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);

// Save metadata
$metaFile = __DIR__ . '/../assets/music/tracks.json';
$meta = [];

if (file_exists($metaFile)) {
    $meta = json_decode(file_get_contents($metaFile), true);
    if (!is_array($meta)) {
        $meta = [];
    }
}

$newTrack = [
    'id' => uniqid(),
    'title' => $title ?: 'Untitled',
    'artist' => $artist ?: 'Unknown',
    'description' => $description,
    'url' => 'assets/uploads/music/' . $trackName,
    'cover' => $coverName ? 'assets/uploads/covers/' . $coverName : 'assets/images/default-cover.png',
    'upload_date' => date('Y-m-d H:i:s')
];

$meta[] = $newTrack;

if (!file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
    // Clean up uploaded files if metadata save fails
    unlink($trackPath);
    if ($coverName && $coverName !== 'default-cover.png') {
        unlink($coverPath);
    }
    http_response_code(500);
    die(json_encode(['error' => 'Failed to save metadata']));
}

// Return success response
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Upload successful',
    'track' => $newTrack
]);
?>
