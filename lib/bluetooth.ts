/**
 * Web Bluetooth API helper for ESC/POS thermal printers (e.g. POS-58 BT).
 * Chrome 56+ required. iOS NOT supported.
 */

const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHAR_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

// ESC/POS commands
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const INIT = new Uint8Array([ESC, 0x40]); // Initialize printer
const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]);
const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]);
const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]);
const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]);
const FONT_LARGE = new Uint8Array([GS, 0x21, 0x11]); // Double width + height
const FONT_NORMAL = new Uint8Array([GS, 0x21, 0x00]);
const CUT = new Uint8Array([GS, 0x56, 0x00]); // Full cut
const FEED_3 = new Uint8Array([ESC, 0x64, 0x03]); // Feed 3 lines

interface PrintData {
  clinicName: string;
  doctorName: string;
  patientName: string;
  date: string;
  diagnosis?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions?: string[];
  followUp?: string;
}

/**
 * Check if Web Bluetooth is available in this browser.
 */
export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Connect to a Bluetooth thermal printer, format the prescription receipt,
 * and send it. Returns true on success.
 */
export async function printPrescription(data: PrintData): Promise<boolean> {
  if (!isBluetoothSupported()) {
    throw new Error('Web Bluetooth is not supported in this browser');
  }

  try {
    // Request printer device
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: [PRINTER_SERVICE_UUID] }],
      optionalServices: [PRINTER_SERVICE_UUID],
    });

    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(PRINTER_CHAR_UUID);

    // Build receipt buffer
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    // Helper to add text
    const addText = (text: string) => chunks.push(encoder.encode(text + '\n'));
    const addCmd = (cmd: Uint8Array) => chunks.push(cmd);
    const addLine = () => chunks.push(new Uint8Array([LF]));
    const addSeparator = () => addText('--------------------------------');

    // Initialize
    addCmd(INIT);

    // Header
    addCmd(ALIGN_CENTER);
    addCmd(FONT_LARGE);
    addCmd(BOLD_ON);
    addText(data.clinicName);
    addCmd(FONT_NORMAL);
    addCmd(BOLD_OFF);
    addText('Dr. ' + data.doctorName);
    addSeparator();

    // Patient info
    addCmd(ALIGN_LEFT);
    addText('Patient: ' + data.patientName);
    addText('Date: ' + data.date);
    addSeparator();

    // Diagnosis
    if (data.diagnosis) {
      addCmd(BOLD_ON);
      addText('Dx: ' + data.diagnosis);
      addCmd(BOLD_OFF);
      addLine();
    }

    // Medications
    addCmd(BOLD_ON);
    addCmd(ALIGN_CENTER);
    addText('--- PRESCRIPTION ---');
    addCmd(ALIGN_LEFT);
    addCmd(BOLD_OFF);
    addLine();

    data.medications.forEach((med, i) => {
      addCmd(BOLD_ON);
      addText((i + 1) + '. ' + med.name);
      addCmd(BOLD_OFF);
      addText('   ' + med.dosage + ' | ' + med.frequency + ' | ' + med.duration);
      addLine();
    });

    addSeparator();

    // Instructions
    if (data.instructions && data.instructions.length > 0) {
      addCmd(BOLD_ON);
      addText('Instructions:');
      addCmd(BOLD_OFF);
      data.instructions.forEach((inst) => addText('\u2022 ' + inst));
      addLine();
    }

    // Follow-up
    if (data.followUp) {
      addText('Follow-up: ' + data.followUp);
      addLine();
    }

    addSeparator();
    addCmd(ALIGN_CENTER);
    addText('DocScribe - Digital Prescription');
    addCmd(FEED_3);
    addCmd(CUT);

    // Merge all chunks
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Send in 20-byte chunks (BLE MTU limit)
    const CHUNK_SIZE = 20;
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      const slice = buffer.slice(i, Math.min(i + CHUNK_SIZE, buffer.length));
      await characteristic.writeValue(slice);
      // Small delay between chunks to prevent buffer overflow
      await new Promise((r) => setTimeout(r, 20));
    }

    device.gatt!.disconnect();
    return true;
  } catch (err) {
    console.error('Bluetooth print error:', err);
    throw err;
  }
}
