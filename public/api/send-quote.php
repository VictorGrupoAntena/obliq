<?php
/**
 * Obliq Productions — Quote Request Handler
 *
 * Receives JSON POST data from the rental quote form,
 * validates inputs, applies rate limiting, and sends
 * an HTML email to info@obliqproductions.com.
 */

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
$allowedOrigins = [
    'https://obliqproductions.com',
    'https://www.obliqproductions.com',
    'http://localhost:4321',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a JSON response and terminate.
 */
function respond(bool $success, string $message, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Sanitize a string for safe HTML output.
 */
function clean(string $value): string
{
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

/**
 * Get translated strings for a given language.
 */
function t(string $lang): array
{
    $strings = [
        'es' => [
            'subject'           => 'Solicitud de presupuesto',
            'heading'           => 'Solicitud de presupuesto',
            'product'           => 'Producto',
            'days'              => 'Dias',
            'price_day'         => 'Precio/dia',
            'subtotal'          => 'Subtotal',
            'pack'              => 'Pack',
            'discount'          => 'Descuento',
            'total'             => 'Total',
            'vat_note'          => 'IVA no incluido',
            'client_info'       => 'Datos del cliente',
            'company'           => 'Empresa',
            'email'             => 'Email',
            'phone'             => 'Telefono',
            'dates'             => 'Fechas',
            'start_date'        => 'Fecha de inicio',
            'return_date'       => 'Fecha de devolucion',
            'rental_days'       => 'Dias de alquiler',
            'notes'             => 'Notas del cliente',
            'timestamp'         => 'Enviado el',
            'success'           => 'Solicitud enviada correctamente. Nos pondremos en contacto contigo pronto.',
            'error_method'      => 'Metodo no permitido.',
            'error_rate'        => 'Demasiadas solicitudes. Intentalo de nuevo en unos minutos.',
            'error_body'        => 'Cuerpo de la solicitud no valido.',
            'error_required'    => 'Todos los campos obligatorios deben estar completos.',
            'error_email'       => 'Direccion de correo electronico no valida.',
            'error_products'    => 'Debes incluir al menos un producto.',
            'error_send'        => 'No se pudo enviar el correo. Intentalo de nuevo mas tarde.',
        ],
        'en' => [
            'subject'           => 'Quote request',
            'heading'           => 'Quote Request',
            'product'           => 'Product',
            'days'              => 'Days',
            'price_day'         => 'Price/day',
            'subtotal'          => 'Subtotal',
            'pack'              => 'Pack',
            'discount'          => 'Discount',
            'total'             => 'Total',
            'vat_note'          => 'VAT not included',
            'client_info'       => 'Client Information',
            'company'           => 'Company',
            'email'             => 'Email',
            'phone'             => 'Phone',
            'dates'             => 'Dates',
            'start_date'        => 'Start date',
            'return_date'       => 'Return date',
            'rental_days'       => 'Rental days',
            'notes'             => 'Client notes',
            'timestamp'         => 'Submitted on',
            'success'           => 'Quote request sent successfully. We will contact you soon.',
            'error_method'      => 'Method not allowed.',
            'error_rate'        => 'Too many requests. Please try again in a few minutes.',
            'error_body'        => 'Invalid request body.',
            'error_required'    => 'All required fields must be filled in.',
            'error_email'       => 'Invalid email address.',
            'error_products'    => 'You must include at least one product.',
            'error_send'        => 'Could not send the email. Please try again later.',
        ],
    ];

    return $strings[$lang] ?? $strings['es'];
}

// ---------------------------------------------------------------------------
// Only POST allowed
// ---------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, t('es')['error_method'], 405);
}

// ---------------------------------------------------------------------------
// Rate limiting (session-based, per IP)
// ---------------------------------------------------------------------------
session_start();

$ip            = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateKey       = 'quote_rate_' . md5($ip);
$maxRequests   = 5;
$windowSeconds = 600; // 10 minutes
$now           = time();

if (!isset($_SESSION[$rateKey])) {
    $_SESSION[$rateKey] = [];
}

// Purge entries older than the window
$_SESSION[$rateKey] = array_values(array_filter(
    $_SESSION[$rateKey],
    fn(int $ts) => ($now - $ts) < $windowSeconds
));

// We parse the language early so rate-limit message is in the right language.
// Read body once and keep it.
$rawBody = file_get_contents('php://input');
$data    = json_decode($rawBody, true);
$lang    = (isset($data['lang']) && $data['lang'] === 'en') ? 'en' : 'es';
$tr      = t($lang);

if (count($_SESSION[$rateKey]) >= $maxRequests) {
    respond(false, $tr['error_rate'], 429);
}

// Record this request
$_SESSION[$rateKey][] = $now;

// ---------------------------------------------------------------------------
// Parse & validate
// ---------------------------------------------------------------------------
if (!is_array($data)) {
    respond(false, $tr['error_body'], 400);
}

// Honeypot — silent success (bots fill hidden fields)
if (!empty($data['website'])) {
    respond(true, $tr['success']);
}

// Anti-bot: JS token check (bots without JS won't generate this)
$token     = $data['_token'] ?? '';
$tokenTime = (int) ($data['_t'] ?? 0);
$secret    = 'obliq_quote_' . date('Y-m-d');

if ($token === '' || $token !== hash('sha256', $secret . $tokenTime)) {
    // Missing or invalid token — likely a bot without JS
    respond(true, $tr['success']); // silent success to not tip off bots
}

// Anti-bot: minimum time check (humans need > 3 seconds to fill a form)
$elapsed = $now - $tokenTime;
if ($elapsed < 3) {
    respond(true, $tr['success']); // too fast — bot, silent success
}

// Required fields
$company   = clean($data['company'] ?? '');
$email     = trim($data['email'] ?? '');
$phone     = clean($data['phone'] ?? '');
$startDate = clean($data['startDate'] ?? '');
$days      = (int) ($data['days'] ?? 1);
$notes     = clean($data['notes'] ?? '');
$total     = (float) ($data['total'] ?? 0);
$discount  = (float) ($data['discount'] ?? 0);
$products  = $data['products'] ?? [];

if ($company === '' || $email === '' || $phone === '' || $startDate === '') {
    respond(false, $tr['error_required'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, $tr['error_email'], 422);
}

// Phone validation: at least 6 digits, allows +, spaces, dashes, dots, parens
$phoneDigits = preg_replace('/\D/', '', $phone);
if (strlen($phoneDigits) < 6 || strlen($phoneDigits) > 15) {
    respond(false, $lang === 'en' ? 'Invalid phone number.' : 'Número de teléfono no válido.', 422);
}

// Start date validation: must be a valid date, not in the past
$startDtCheck = date_create($startDate);
if ($startDtCheck === false) {
    respond(false, $lang === 'en' ? 'Invalid start date.' : 'Fecha de inicio no válida.', 422);
}
$today = date_create('today');
if ($startDtCheck < $today) {
    respond(false, $lang === 'en' ? 'Start date cannot be in the past.' : 'La fecha de inicio no puede ser pasada.', 422);
}

if (!is_array($products) || count($products) === 0) {
    respond(false, $tr['error_products'], 422);
}

// ---------------------------------------------------------------------------
// Calculate return date
// ---------------------------------------------------------------------------
$startDt   = date_create($startDate);
$returnDate = $startDate; // fallback
if ($startDt !== false) {
    $returnDt   = clone $startDt;
    $returnDt->modify('+' . max(1, $days) . ' days');
    $returnDate = $returnDt->format('Y-m-d');
}

// Format dates for display
$displayStartDate  = $startDt ? $startDt->format('d/m/Y') : $startDate;
$displayReturnDate = $startDt ? $returnDt->format('d/m/Y') : $returnDate;

// ---------------------------------------------------------------------------
// Build HTML email
// ---------------------------------------------------------------------------
$productRows = '';
foreach ($products as $p) {
    $pName     = clean($p['name'] ?? '');
    $pDays     = (int) ($p['days'] ?? $days);
    $pPrice    = (float) ($p['price'] ?? 0);
    $pSubtotal = (float) ($p['subtotal'] ?? 0);
    $pPack     = clean($p['packName'] ?? '');

    $packBadge = $pPack !== ''
        ? '<span style="display:inline-block;background:#333;color:#ccc;font-size:11px;padding:2px 6px;border-radius:3px;margin-left:6px;">' . $pPack . '</span>'
        : '';

    $productRows .= '
        <tr style="border-bottom:1px solid #333;">
            <td style="padding:10px 12px;color:#eee;">' . $pName . $packBadge . '</td>
            <td style="padding:10px 12px;color:#eee;text-align:center;">' . $pDays . '</td>
            <td style="padding:10px 12px;color:#eee;text-align:right;">' . number_format($pPrice, 2, ',', '.') . ' &euro;</td>
            <td style="padding:10px 12px;color:#eee;text-align:right;">' . number_format($pSubtotal, 2, ',', '.') . ' &euro;</td>
        </tr>';
}

$discountRow = '';
if ($discount > 0) {
    $discountRow = '
        <tr style="border-bottom:1px solid #333;">
            <td colspan="3" style="padding:10px 12px;color:#aaa;text-align:right;">' . $tr['discount'] . ' (' . number_format($discount, 0) . '%)</td>
            <td style="padding:10px 12px;color:#e74c3c;text-align:right;font-weight:bold;">-' . number_format($discount, 0) . '%</td>
        </tr>';
}

$notesSection = '';
if ($notes !== '') {
    $notesSection = '
        <div style="margin-top:24px;">
            <h3 style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">' . $tr['notes'] . '</h3>
            <p style="color:#ddd;font-size:14px;line-height:1.6;margin:0;padding:12px;background:#1a1a1a;border-radius:6px;border-left:3px solid #888;">' . nl2br($notes) . '</p>
        </div>';
}

$timestamp = date('d/m/Y H:i:s');

$html = '<!DOCTYPE html>
<html lang="' . $lang . '">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">

        <!-- Header -->
        <div style="text-align:center;padding:32px 0;border-bottom:1px solid #222;">
            <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:4px;color:#ffffff;">OBLIQ PRODUCTIONS</h1>
            <p style="margin:8px 0 0 0;font-size:14px;color:#888;letter-spacing:1px;">' . $tr['heading'] . '</p>
        </div>

        <!-- Products table -->
        <div style="margin-top:24px;">
            <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;">
                <thead>
                    <tr style="background:#1a1a1a;border-bottom:2px solid #333;">
                        <th style="padding:12px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;">' . $tr['product'] . '</th>
                        <th style="padding:12px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;">' . $tr['days'] . '</th>
                        <th style="padding:12px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;">' . $tr['price_day'] . '</th>
                        <th style="padding:12px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;">' . $tr['subtotal'] . '</th>
                    </tr>
                </thead>
                <tbody>
                    ' . $productRows . '
                    ' . $discountRow . '
                </tbody>
                <tfoot>
                    <tr style="background:#1a1a1a;">
                        <td colspan="3" style="padding:14px 12px;color:#fff;font-weight:bold;text-align:right;font-size:15px;">' . $tr['total'] . '</td>
                        <td style="padding:14px 12px;color:#fff;font-weight:bold;text-align:right;font-size:18px;">' . number_format($total, 2, ',', '.') . ' &euro;</td>
                    </tr>
                    <tr>
                        <td colspan="4" style="padding:4px 12px 12px;color:#666;font-size:11px;text-align:right;background:#1a1a1a;">' . $tr['vat_note'] . '</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- Client info -->
        <div style="margin-top:24px;">
            <h3 style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">' . $tr['client_info'] . '</h3>
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:13px;width:140px;">' . $tr['company'] . '</td>
                    <td style="padding:8px 0;color:#eee;font-size:14px;">' . $company . '</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:13px;">' . $tr['email'] . '</td>
                    <td style="padding:8px 0;color:#eee;font-size:14px;"><a href="mailto:' . clean($email) . '" style="color:#4da6ff;text-decoration:none;">' . clean($email) . '</a></td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:13px;">' . $tr['phone'] . '</td>
                    <td style="padding:8px 0;color:#eee;font-size:14px;">' . $phone . '</td>
                </tr>
            </table>
        </div>

        <!-- Dates -->
        <div style="margin-top:24px;">
            <h3 style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">' . $tr['dates'] . '</h3>
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:13px;width:140px;">' . $tr['start_date'] . '</td>
                    <td style="padding:8px 0;color:#eee;font-size:14px;">' . $displayStartDate . '</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:13px;">' . $tr['return_date'] . '</td>
                    <td style="padding:8px 0;color:#eee;font-size:14px;">' . $displayReturnDate . '</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:13px;">' . $tr['rental_days'] . '</td>
                    <td style="padding:8px 0;color:#eee;font-size:14px;">' . $days . '</td>
                </tr>
            </table>
        </div>

        <!-- Notes -->
        ' . $notesSection . '

        <!-- Footer -->
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #222;text-align:center;">
            <p style="margin:0;color:#555;font-size:11px;">' . $tr['timestamp'] . ' ' . $timestamp . '</p>
            <p style="margin:4px 0 0 0;color:#444;font-size:11px;">obliqproductions.com</p>
        </div>

    </div>
</body>
</html>';

// ---------------------------------------------------------------------------
// Send email
// ---------------------------------------------------------------------------
$to      = 'info@obliqproductions.com';
$subject = $tr['subject'] . ' — ' . $company;

$headers  = "From: noreply@obliqproductions.com\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "X-Mailer: ObliqQuoteForm/1.0\r\n";

$sent = mail($to, $subject, $html, $headers);

if (!$sent) {
    respond(false, $tr['error_send'], 500);
}

respond(true, $tr['success']);
