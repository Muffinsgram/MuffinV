<?php
    header('Content-Type: application/json');

    // Geçerli lisans anahtarları (veritabanına taşıyabilirsin)
    $validKeys = [
        'MADDEX_1234-5678-9012',
        'MADDEX_5678-9012-3456'
    ];

    // Gelen anahtarı al
    $key = $_GET['key'] ?? '';

    // Anahtarı kontrol et
    if (in_array($key, $validKeys)) {
        echo json_decode(['status' => 'valid']); // Düzeltme: json_encode olmalı
    } else {
        echo json_decode(['status' => 'invalid']); // Düzeltme: json_encode olmalı
    }
    ?>
