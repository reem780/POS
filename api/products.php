<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $q = $_GET['q'] ?? '';
    if ($q) {
        $stmt = $conn->prepare("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.name LIKE ? OR p.barcode = ?");
        $stmt->execute(["%$q%", $q]);
    } else {
        $stmt = $conn->query("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id");
    }
    sendResponse($stmt->fetchAll());
}

if (!isAuthenticated()) sendResponse(["error" => "Unauthorized"], 401);

if ($method === 'POST') {
    if (!isAdmin()) sendResponse(["error" => "Forbidden"], 403);
    $body = getJsonBody();
    try {
        $stmt = $conn->prepare("INSERT INTO products (barcode, name, category_id, supplier_id, price, cost, quantity, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $body['barcode'], $body['name'], $body['category_id'], $body['supplier_id'] ?? null,
            $body['price'], $body['cost'], $body['quantity'], $body['image'] ?? null
        ]);
        sendResponse(["success" => true, "id" => $conn->lastInsertId()]);
    } catch (Exception $e) {
        sendResponse(["error" => $e->getMessage()], 500);
    }
}

if ($method === 'PUT') {
    if (!isAdmin()) sendResponse(["error" => "Forbidden"], 403);
    $id = $_GET['id'] ?? null;
    if (!$id) sendResponse(["error" => "ID required"], 400);
    $body = getJsonBody();
    try {
        $stmt = $conn->prepare("UPDATE products SET barcode = ?, name = ?, category_id = ?, supplier_id = ?, price = ?, cost = ?, quantity = ?, image = ? WHERE id = ?");
        $stmt->execute([
            $body['barcode'], $body['name'], $body['category_id'], $body['supplier_id'] ?? null,
            $body['price'], $body['cost'], $body['quantity'], $body['image'] ?? null, $id
        ]);
        sendResponse(["success" => true]);
    } catch (Exception $e) {
        sendResponse(["error" => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    if (!isAdmin()) sendResponse(["error" => "Forbidden"], 403);
    $id = $_GET['id'] ?? null;
    if (!$id) sendResponse(["error" => "ID required"], 400);
    try {
        $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(["success" => true]);
    } catch (Exception $e) {
        sendResponse(["error" => $e->getMessage()], 500);
    }
}
?>
