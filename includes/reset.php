<?php
// reset.php - Secure password reset for MelodyCloud admin
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(400);
    exit('Invalid request');
}

$new = $_POST['new_password'] ?? '';
$confirm = $_POST['confirm_password'] ?? '';
if (strlen($new) < 8 || $new !== $confirm) {
    http_response_code(400);
    exit('Password requirements not met');
}

// Update password hash in a flat file
$credsFile = __DIR__ . '/admin_creds.json';
$creds = [
    'username' => 'cyberghost',
    'password_hash' => password_hash($new, PASSWORD_DEFAULT)
];
file_put_contents($credsFile, json_encode($creds, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo 'Password reset successful!'; 