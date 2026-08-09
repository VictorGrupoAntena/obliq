<?php
/**
 * Obliq Productions — Contact Form Handler
 *
 * Receives JSON POST data from the generic contact form,
 * validates and sanitizes inputs, applies the same 4-layer
 * anti-spam as send-quote.php (honeypot, JS token, minimum
 * time, rate limiting), and sends an HTML email to the
 * recipient configured in OBLIQ_MAIL_TO (fail-closed).
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
 * Sanitize a string for safe HTML output (XSS prevention).
 */
function clean(string $value): string
{
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

/**
 * Sanitize a string for use in the email Subject header:
 * strips CR/LF to prevent header injection.
 */
function headerSafe(string $value): string
{
    return trim(str_replace(["\r", "\n", "%0a", "%0d"], '', $value));
}

/**
 * Get translated strings for a given language.
 */
function t(string $lang): array
{
    $strings = [
        'es' => [
            'subject'        => 'Nuevo mensaje de contacto',
            'heading'        => 'Mensaje de contacto',
            'client_info'    => 'Datos del contacto',
            'name'           => 'Nombre',
            'company'        => 'Empresa',
            'email'          => 'Email',
            'phone'          => 'Telefono',
            'service'        => 'Servicio de interes',
            'interest'       => 'Producto/Pack de interes',
            'message'        => 'Mensaje',
            'timestamp'      => 'Enviado el',
            'success'        => 'Mensaje enviado correctamente. Te responderemos lo antes posible.',
            'error_method'   => 'Metodo no permitido.',
            'error_rate'     => 'Demasiadas solicitudes. Intentalo de nuevo en unos minutos.',
            'error_body'     => 'Cuerpo de la solicitud no valido.',
            'error_required' => 'Todos los campos obligatorios deben estar completos.',
            'error_email'    => 'Direccion de correo electronico no valida.',
            'error_phone'    => 'Número de teléfono no válido.',
            'error_send'     => 'No se pudo enviar el correo. Intentalo de nuevo mas tarde.',
        ],
        'en' => [
            'subject'        => 'New contact message',
            'heading'        => 'Contact Message',
            'client_info'    => 'Contact Information',
            'name'           => 'Name',
            'company'        => 'Company',
            'email'          => 'Email',
            'phone'          => 'Phone',
            'service'        => 'Service of interest',
            'interest'       => 'Product/Pack of interest',
            'message'        => 'Message',
            'timestamp'      => 'Submitted on',
            'success'        => 'Message sent successfully. We will get back to you as soon as possible.',
            'error_method'   => 'Method not allowed.',
            'error_rate'     => 'Too many requests. Please try again in a few minutes.',
            'error_body'     => 'Invalid request body.',
            'error_required' => 'All required fields must be filled in.',
            'error_email'    => 'Invalid email address.',
            'error_phone'    => 'Invalid phone number.',
            'error_send'     => 'Could not send the email. Please try again later.',
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
$rateKey       = 'contact_rate_' . md5($ip);
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
$secret    = 'obliq_contact_' . date('Y-m-d');

if ($token === '' || $token !== hash('sha256', $secret . $tokenTime)) {
    // Missing or invalid token — likely a bot without JS
    respond(true, $tr['success']); // silent success to not tip off bots
}

// Anti-bot: minimum time check (humans need > 3 seconds to fill a form)
$elapsed = $now - $tokenTime;
if ($elapsed < 3) {
    respond(true, $tr['success']); // too fast — bot, silent success
}

// Fields — sanitize EVERYTHING that will be rendered in the email (XSS)
$name     = clean($data['name'] ?? '');
$email    = trim($data['email'] ?? '');
$phone    = clean($data['phone'] ?? '');
$company  = clean($data['company'] ?? '');
$service  = clean($data['service'] ?? '');
$interest = clean($data['interest'] ?? ''); // hidden producto/pack pre-filled field
$message  = clean($data['message'] ?? '');

// Required: name, email, message (phone/company/service/interest are optional)
if ($name === '' || $email === '' || $message === '') {
    respond(false, $tr['error_required'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, $tr['error_email'], 422);
}

// Phone validation only if provided: 6-15 digits
if ($phone !== '') {
    $phoneDigits = preg_replace('/\D/', '', $phone);
    if (strlen($phoneDigits) < 6 || strlen($phoneDigits) > 15) {
        respond(false, $tr['error_phone'], 422);
    }
}

// Length caps (defense in depth against abuse)
if (mb_strlen($name) > 200 || mb_strlen($company) > 200 || mb_strlen($service) > 200
    || mb_strlen($interest) > 300 || mb_strlen($message) > 5000) {
    respond(false, $tr['error_body'], 422);
}

// ---------------------------------------------------------------------------
// Build HTML email (same dark visual style as send-quote.php)
// ---------------------------------------------------------------------------

/** Optional row helper — only rendered when the value is non-empty. */
function infoRow(string $label, string $value): string
{
    if ($value === '') return '';
    return '
                <tr>
                    <td style="padding:8px 0;color:#888;font-size:13px;width:180px;vertical-align:top;">' . $label . '</td>
                    <td style="padding:8px 0;color:#eee;font-size:14px;">' . $value . '</td>
                </tr>';
}

$emailSafe = clean($email);

$rows  = infoRow($tr['name'], $name);
$rows .= infoRow($tr['company'], $company);
$rows .= infoRow($tr['email'], '<a href="mailto:' . $emailSafe . '" style="color:#4da6ff;text-decoration:none;">' . $emailSafe . '</a>');
$rows .= infoRow($tr['phone'], $phone);
$rows .= infoRow($tr['service'], $service);
$rows .= infoRow($tr['interest'], $interest !== '' ? '<strong>' . $interest . '</strong>' : '');

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

        <!-- Contact info -->
        <div style="margin-top:24px;">
            <h3 style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">' . $tr['client_info'] . '</h3>
            <table style="width:100%;border-collapse:collapse;">' . $rows . '
            </table>
        </div>

        <!-- Message -->
        <div style="margin-top:24px;">
            <h3 style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">' . $tr['message'] . '</h3>
            <p style="color:#ddd;font-size:14px;line-height:1.6;margin:0;padding:12px;background:#1a1a1a;border-radius:6px;border-left:3px solid #888;">' . nl2br($message) . '</p>
        </div>

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
// Destinatario configurable por ENTORNO (variable OBLIQ_MAIL_TO), MISMO patrón
// que send-quote.php. Antes estaba `info@obliqproductions.com` hardcodeado: el
// destino no cambia (la variable del pool de producción vale exactamente eso),
// cambia la FUENTE — staging puede ahora apuntar a un buzón de pruebas en vez
// de escribir al buzón real del cliente. Fail-closed: sin variable NO se envía.
// Se define por dominio en Plesk (PHP-FPM env) — NO en el repo.
$to = getenv('OBLIQ_MAIL_TO');
if ($to === false || trim($to) === '') {
    $to = $_SERVER['OBLIQ_MAIL_TO'] ?? ($_ENV['OBLIQ_MAIL_TO'] ?? '');
}
$to = trim($to);
if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    error_log('[send-contact] OBLIQ_MAIL_TO no configurado o inválido — envío abortado.');
    respond(false, $tr['error_send'], 500);
}

$subject = headerSafe($tr['subject'] . ' — ' . $name . ($interest !== '' ? ' (' . $interest . ')' : ''));

$headers  = "From: noreply@obliqproductions.com\r\n";
$headers .= "Reply-To: " . $email . "\r\n"; // safe: passed FILTER_VALIDATE_EMAIL (no CRLF possible)
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "X-Mailer: ObliqContactForm/1.0\r\n";

// Remitente de SOBRE explícito — ver la nota extensa en send-quote.php. Resumen:
// alinea el sobre con el `From:` para que DMARC (`p=quarantine; aspf=r`) pase
// por SPF y no dependa de la firma DKIM de Plesk, que se cae al desactivar el
// servicio de correo del dominio.
$sent = mail($to, $subject, $html, $headers, '-f noreply@obliqproductions.com');

if (!$sent) {
    respond(false, $tr['error_send'], 500);
}

respond(true, $tr['success']);
