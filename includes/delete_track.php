<?php
// delete_track.php - Secure track deletion
session_start();

header('Content-Type: application/json');

// Check admin session
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['track_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

// Load tracks data
$tracksFile = __DIR__ . '/../assets/music/tracks.json';
if (!file_exists($tracksFile)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Tracks data not found']);
    exit;
}

$tracks = json_decode(file_get_contents($tracksFile), true);
if (!is_array($tracks)) {
    $tracks = [];
}

$trackId = $input['track_id'];
$found = false;
foreach ($tracks as $i => $track) {
    if (isset($track['id']) && $track['id'] === $trackId) {
        $found = true;
        // Delete audio file
        $audioPath = __DIR__ . '/../' . $track['url'];
        if (file_exists($audioPath)) {
            unlink($audioPath);
        }
        // Delete cover image if it's not the default
        $coverPath = __DIR__ . '/../' . $track['cover'];
        if (file_exists($coverPath) && !str_contains($coverPath, 'default-cover.png')) {
            unlink($coverPath);
        }
        // Remove from tracks array
        array_splice($tracks, $i, 1);
        break;
    }
}
if (!$found) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Track not found']);
    exit;
}

// Save updated tracks
if (!file_put_contents($tracksFile, json_encode($tracks, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
    throw new Exception('Failed to save tracks data');
}

echo json_encode(['success' => true, 'message' => 'Track deleted successfully']);
?>
