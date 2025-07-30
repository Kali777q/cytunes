<?php
session_start([
    'cookie_secure' => true,
    'cookie_httponly' => true,
    'use_strict_mode' => true
]);

// Load credentials from environment variables
$admin_user = getenv('ADMIN_USERNAME') ?: 'cyberghost';
$admin_pass_hash = getenv('ADMIN_PASSWORD_HASH') ?: '$2y$10$o6Y/EOotr9RiCsOwvbjrQe0cj9L4nTUEfvRpftQKusSA.XaAvWoSK';

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Method Not Allowed']));
}

// Validate input
$user = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_STRING);
$pass = filter_input(INPUT_POST, 'password', FILTER_UNSAFE_RAW);

if (empty($user) || empty($pass)) {
    http_response_code(400);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Username and password are required']));
}

// Verify credentials
if ($user === $admin_user && password_verify($pass, $admin_pass_hash)) {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
    
    // Regenerate session ID to prevent fixation
    session_regenerate_id(true);
    
    header('Location: ../admin.html');
    exit;
} else {
    // Delay response to prevent timing attacks
    usleep(random_int(200000, 500000));
    header('Location: ../login.html?error=1');
    exit;
}
?>