<?php
require_once 'config.php';

if (!isAuthenticated()) sendResponse(["error" => "Unauthorized"], 401);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if ($_SESSION['role'] === 'admin') {
        $stmt = $conn->query("SELECT s.*, u.name as user_name FROM sales s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC");
    } else {
        $stmt = $conn->prepare("SELECT s.*, u.name as user_name FROM sales s JOIN users u ON s.user_id = u.id WHERE s.user_id = ? ORDER BY s.created_at DESC");
        $stmt->execute([$_SESSION['user_id']]);
    }
    sendResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    $body = getJsonBody();
    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("INSERT INTO sales (user_id, customer_id, subtotal, discount, tax, total, amount_paid, change_amount, currency, exchange_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $_SESSION['user_id'], $body['customer_id'] ?? null, $body['subtotal'], $body['discount'], 
            $body['tax'], $body['total'], $body['amount_paid'], $body['change_amount'], 
            $body['currency'], $body['exchange_rate']
        ]);
        $saleId = $conn->lastInsertId();

        foreach ($body['items'] as $item) {
            $stmt = $conn->prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$saleId, $item['id'], $item['quantity'], $item['price'], $item['quantity'] * $item['price']]);
            
            $stmt = $conn->prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['id']]);
            
            $stmt = $conn->prepare("INSERT INTO inventory_log (product_id, change_type, quantity, note) VALUES (?, 'sale', ?, ?)");
            $stmt->execute([$item['id'], -$item['quantity'], "Sale #$saleId"]);
        }

        $conn->commit();
        sendResponse(["success" => true, "saleId" => $saleId]);
    } catch (Exception $e) {
        $conn->rollBack();
        sendResponse(["error" => $e->getMessage()], 500);
    }
}
?>
