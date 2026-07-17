/**
 * Contact form logic — shared by /contacto/ (ES) and /en/contact/ (EN).
 *
 * Replica el patrón del quote form (presupuesto.astro / send-quote.php):
 * - Anti-spam: honeypot + token SHA-256 + tiempo mínimo (el rate limiting
 *   vive en el PHP)
 * - Estados UX: loading / success / error
 * - Detección de entorno: fuera de obliqproductions.com → modo simulado
 * - Pre-relleno vía query params: ?servicio=/?service= (select) y
 *   ?producto=/?product=/?pack= (campo oculto interest)
 */

export function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const formWrapper = document.getElementById('contact-form-wrapper');
  const successEl = document.getElementById('contact-success');
  const errorEl = document.getElementById('contact-error');
  const simulatedEl = document.getElementById('contact-simulated');
  const submitBtn = document.getElementById('contact-submit-btn') as HTMLButtonElement | null;
  const submitText = document.getElementById('contact-submit-text');
  const interestInput = document.getElementById('interest') as HTMLInputElement | null;
  const serviceSelect = document.getElementById('service') as HTMLSelectElement | null;

  if (!form || !formWrapper || !successEl) return;

  const lang = document.documentElement.lang || 'es';

  const isProduction =
    window.location.hostname === 'obliqproductions.com' ||
    window.location.hostname === 'www.obliqproductions.com';
  if (!isProduction && simulatedEl) {
    simulatedEl.classList.remove('hidden');
  }

  // ---- Pre-relleno desde la URL (botones "Estoy interesado") ----
  const params = new URLSearchParams(window.location.search);

  const serviceParam = params.get('servicio') || params.get('service');
  if (serviceParam && serviceSelect) {
    const match = Array.from(serviceSelect.options).find(
      (o) => o.value.toLowerCase() === serviceParam.toLowerCase()
    );
    if (match) serviceSelect.value = match.value;
  }

  const interestParts = [
    params.get('producto') || params.get('product'),
    params.get('pack'),
  ].filter(Boolean);
  if (interestParts.length > 0 && interestInput) {
    interestInput.value = interestParts.join(' + ');
  }

  // ---- Anti-bot: token SHA-256 + tiempo mínimo (mismo esquema que quote) ----
  const pageLoadTime = Math.floor(Date.now() / 1000);
  const secret = 'obliq_contact_' + new Date().toISOString().split('T')[0];
  async function generateToken(timestamp: number): Promise<string> {
    const data = new TextEncoder().encode(secret + timestamp);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  if (submitText) {
    submitText.dataset.original = submitText.textContent || '';
    submitText.dataset.submitting = lang === 'en' ? 'SENDING...' : 'ENVIANDO...';
  }

  function setLoading(loading: boolean): void {
    if (submitBtn) submitBtn.disabled = loading;
    if (submitText) {
      submitText.textContent = loading
        ? submitText.dataset.submitting || 'ENVIANDO...'
        : submitText.dataset.original || '';
    }
  }

  function showSuccess(): void {
    formWrapper!.classList.add('hidden');
    successEl!.classList.remove('hidden');
    // Mueve el foco al bloque de éxito para que los lectores de pantalla lo anuncien
    (successEl as HTMLElement).focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setLoading(true);
    errorEl?.classList.add('hidden');

    const formData = new FormData(form);
    const token = await generateToken(pageLoadTime);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      company: formData.get('company') || '',
      service: formData.get('service') || '',
      interest: formData.get('interest') || '',
      message: formData.get('message'),
      lang,
      website: formData.get('website') || '',
      _token: token,
      _t: pageLoadTime,
    };

    if (!isProduction) {
      console.log('[Contact Form] Simulated submission:', payload);
      showSuccess();
      return;
    }

    try {
      const response = await fetch('/api/send-contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess();
      } else {
        errorEl?.classList.remove('hidden');
        setLoading(false);
      }
    } catch {
      errorEl?.classList.remove('hidden');
      setLoading(false);
    }
  });
}
