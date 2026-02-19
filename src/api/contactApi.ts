import apiClient from './apiClient';

/**
 * ==========================================
 * TYPE DEFINITIONS
 * ==========================================
 */
export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

/**
 * 🌍 PUBLIC: Submit a contact inquiry to the RDC Admin Service.
 * * Target Service: VITE_ADMIN_SERVICE_URL
 * Backend Route: POST /api/contact
 * * Note: Uses the centralized apiClient which handles production base URLs
 * and automatic data unwrapping.
 */
export const submitContactInquiry = async (data: ContactRequest): Promise<any> => {
  // ✅ Interceptor in apiClient.ts already returns response.data
  return await apiClient.post('/contact', data);
};

export default {
  submitContactInquiry,
};