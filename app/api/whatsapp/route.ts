import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, patientName, pdfUrl, doctorName } = await request.json();

    if (!phone || !patientName) {
      return NextResponse.json(
        { error: 'Phone and patient name are required' },
        { status: 400 },
      );
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'prescription_delivery';

    if (!phoneNumberId || !accessToken) {
      // In development without credentials, simulate success
      console.log(`[WhatsApp Mock] Would send prescription to ${phone} for ${patientName}`);
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'WhatsApp credentials not configured — simulated send.',
      });
    }

    // Format phone: ensure +91 prefix, remove spaces
    const formattedPhone = phone.replace(/\D/g, '');
    const fullPhone = formattedPhone.startsWith('91')
      ? formattedPhone
      : `91${formattedPhone}`;

    // Send template message via WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: fullPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: patientName },
                  { type: 'text', text: doctorName || 'Your Doctor' },
                ],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', errorData);
      return NextResponse.json(
        { error: 'WhatsApp send failed', details: errorData },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, messageId: data.messages?.[0]?.id });
  } catch (error) {
    console.error('WhatsApp route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
