import apiClient from './apiClient';

export interface ContactRequest {
    name: string;
    email: string;
    message: string;
}

/**
 * 🌍 PUBLIC: Submit a contact inquiry to the RDC Admin Service.
 * Matches Backend: POST /api/contact
 */
export const submitContactInquiry = async (data: ContactRequest) => {
    const response = await apiClient.post('/contact', data);
    return response.data;
};