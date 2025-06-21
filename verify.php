<?php
header('Content-Type: application/json');

$validKeys = [
    'MADDEX_1234-5678-9012',
    'MADDEX_5678-9012-3456'
];

// Gelen anahtarı al
$key = $_GET['key'] ?? '';

// Anahtarı kontrol et
if (in_array($key, $validKeys)) {
    echo json_encode(['status' => 'valid']);
} else {
    echo json_encode(['status' => 'invalid']);
}
?>