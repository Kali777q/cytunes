<?php
// logout.php - Secure logout for MelodyCloud
session_start();
session_unset();
session_destroy();
header('Location: ../login.html');
exit; 