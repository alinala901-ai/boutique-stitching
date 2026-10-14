/**
 * WhatsApp Integration Configuration for Boutique Stitching
 * 
 * BUSINESS OWNER NOTICE:
 * The official business WhatsApp number has not yet been configured.
 * When ready, enter your international WhatsApp phone number below (e.g., '923001234567').
 */

import { StitchingOrder, OrderMeasurement } from '../types';

export interface WhatsAppConfig {
  phoneNumber: string;
  isConfigured: boolean;
  businessName: string;
}

export const WHATSAPP_CONFIG: WhatsAppConfig = {
  // Empty until provided by the business owner. DO NOT invent fake numbers.
  phoneNumber: '',
  isConfigured: false,
  businessName: 'Boutique Stitching (Sadiqabad)',
};

/**
 * Formats a clean, readable consultation summary suitable for WhatsApp.
 */
export const formatWhatsAppConsultationMessage = (
  order: Partial<StitchingOrder>,
  measurements?: OrderMeasurement
): string => {
  const lines: string[] = [
    `*🧵 BOUTIQUE STITCHING — CONSULTATION REQUEST*`,
    `---------------------------------------`,
    `*Order Reference:* ${order.order_number || 'Pending'}`,
    `*Customer Name:* ${order.customer_name || 'N/A'}`,
    `*Phone:* ${order.phone || 'N/A'}`,
    `*Service:* ${order.service_type || 'Custom Stitching'} (${order.customer_type === 'kids' ? 'Kids' : 'Ladies'})`,
    `*Category:* ${order.category || 'General'}`,
  ];

  if (measurements) {
    lines.push(`\n*📐 Measurements (${measurements.unit || 'inches'}):*`);
    if (measurements.kameez_length) lines.push(`• Kameez Length: ${measurements.kameez_length}`);
    if (measurements.chest) lines.push(`• Chest: ${measurements.chest}`);
    if (measurements.waist) lines.push(`• Waist: ${measurements.waist}`);
    if (measurements.hips) lines.push(`• Hips: ${measurements.hips}`);
    if (measurements.shoulder) lines.push(`• Shoulder: ${measurements.shoulder}`);
    if (measurements.armhole) lines.push(`• Armhole: ${measurements.armhole}`);
    if (measurements.sleeve_length) lines.push(`• Sleeve Length: ${measurements.sleeve_length}`);
    if (measurements.trouser_length) lines.push(`• Trouser Length: ${measurements.trouser_length}`);
    if (measurements.shalwar_length) lines.push(`• Shalwar Length: ${measurements.shalwar_length}`);
    if (measurements.additional_measurements) {
      lines.push(`• Notes: ${measurements.additional_measurements}`);
    }
  }

  if (order.special_instructions) {
    lines.push(`\n*📝 Special Instructions:*`);
    lines.push(`${order.special_instructions}`);
  }

  if (order.reference_image_name) {
    lines.push(`\n*🖼️ Reference Design:* ${order.reference_image_name}`);
  }

  lines.push(`\n*Location:* Sadiqabad, Punjab, Pakistan`);
  return lines.join('\n');
};

/**
 * Staff-to-Customer Message Templates (Phase 4)
 */
export const formatStaffOrderConfirmationMessage = (order: Partial<StitchingOrder>): string => {
  return [
    `Assalam-o-Alaikum ${order.customer_name || 'Customer'},`,
    ``,
    `Regarding your order *${order.order_number || 'BS-2026'}* at *Boutique Stitching* (Sadiqabad):`,
    `We have reviewed your consultation request for *${order.service_type || 'Custom Stitching'}* (${order.category || ''}).`,
    ``,
    `Your order has been officially *CONFIRMED* by our master tailor. We will begin precision cutting and stitching.`,
    ``,
    `If you have any questions or additional instructions, feel free to reply directly to this message.`,
    ``,
    `Warm regards,`,
    `Boutique Stitching Atelier`,
    `Sadiqabad, Punjab, Pakistan`,
  ].join('\n');
};

export const formatStaffMeasurementsReviewMessage = (order: Partial<StitchingOrder>): string => {
  return [
    `Assalam-o-Alaikum ${order.customer_name || 'Customer'},`,
    ``,
    `Regarding your order *${order.order_number || 'BS-2026'}* at *Boutique Stitching* (Sadiqabad):`,
    `Our master tailor is currently reviewing your garment measurements and design details.`,
    ``,
    `Could you please confirm if you have any special preferences for sleeve fit, neck cut depth, or bottom style?`,
    ``,
    `Thank you!`,
    `Boutique Stitching Atelier`,
  ].join('\n');
};

export const formatStaffOrderReadyMessage = (order: Partial<StitchingOrder>): string => {
  return [
    `Assalam-o-Alaikum ${order.customer_name || 'Customer'},`,
    ``,
    `Good news! Your tailored outfit for order *${order.order_number || 'BS-2026'}* is *READY*! 🧵✨`,
    ``,
    `Our boutique master has completed all fine hand finishes and quality inspections.`,
    `Your outfit is ready for collection or scheduled delivery at our atelier in Sadiqabad.`,
    ``,
    `Please let us know your preferred collection time.`,
    ``,
    `Warm regards,`,
    `Boutique Stitching Atelier`,
    `Sadiqabad, Punjab, Pakistan`,
  ].join('\n');
};

export const formatStaffGeneralInquiryMessage = (order: Partial<StitchingOrder>): string => {
  return [
    `Assalam-o-Alaikum ${order.customer_name || 'Customer'},`,
    ``,
    `We are contacting you from *Boutique Stitching* (Sadiqabad) regarding your stitching consultation *${order.order_number || 'BS-2026'}*.`,
    ``,
    `How may we assist you with your outfit today?`,
    ``,
    `Boutique Stitching Atelier`,
  ].join('\n');
};

/**
 * Normalizes customer phone numbers to international WhatsApp format (e.g., 0300... -> 92300...)
 */
export const formatInternationalPhoneForWhatsApp = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('03') && digits.length === 11) {
    return '92' + digits.substring(1);
  }
  if (digits.startsWith('92') && digits.length >= 11) {
    return digits;
  }
  if (digits.startsWith('0092')) {
    return digits.substring(2);
  }
  return digits;
};

/**
 * Generates direct WhatsApp chat URL targeting the customer's phone number
 */
export const getCustomerDirectWhatsAppUrl = (customerPhone: string, message: string): string => {
  const cleanPhone = formatInternationalPhoneForWhatsApp(customerPhone);
  if (!cleanPhone) return '';
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
};

/**
 * Generates direct WhatsApp click-to-chat URL if configured.
 */
export const getWhatsAppUrl = (message: string): { url: string; isConfigured: boolean } => {
  const encoded = encodeURIComponent(message);
  if (WHATSAPP_CONFIG.isConfigured && WHATSAPP_CONFIG.phoneNumber) {
    const cleanNumber = WHATSAPP_CONFIG.phoneNumber.replace(/[^0-9]/g, '');
    return {
      url: `https://wa.me/${cleanNumber}?text=${encoded}`,
      isConfigured: true,
    };
  }
  return {
    url: '',
    isConfigured: false,
  };
};
