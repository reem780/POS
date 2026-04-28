<?php
require_once 'config.php';

if (!isAuthenticated() || !isAdmin()) sendResponse(["error" => "Forbidden"], 403);

if ($_GET['type'] === 'summary') {
    $daily = $conn->query("SELECT SUM(total) as total FROM sales WHERE DATE(created_at) = CURDATE()")->fetch();
    $weekly = $conn->query("SELECT SUM(total) as total FROM sales WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetch();
    $monthly = $conn->query("SELECT SUM(total) as total FROM sales WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetch();
    $lowStock = $conn->query("SELECT COUNT(*) as count FROM products WHERE quantity < 10")->fetch();
    
    sendResponse([
        "daily" => $daily['total'] ?: 0,
        "weekly" => $weekly['total'] ?: 0,
        "monthly" => $monthly['total'] ?: 0,
        "lowStock" => $lowStock['count'] ?: 0
    ]);
}
?>
