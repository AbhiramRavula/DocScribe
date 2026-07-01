/**
 * Send a prescription PDF to a patient via WhatsApp Cloud API.
 * This is a client-side helper that calls the /api/whatsapp server route.
 */
export async function sendWhatsApp(
  patientPhone: string,
  patientName: string,
  pdfUrl: string,
  doctorName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: patientPhone,
        patientName,
        pdfUrl,
        doctorName,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'WhatsApp send failed' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
