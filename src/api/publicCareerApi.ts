import axios from 'axios';

/**
 * ✅ PRODUCTION SYNC: Using environment variables for public routes.
 * These bypass the Bearer token interceptors for guest access.
 */
const ADMIN_SERVICE_BASE = import.meta.env.VITE_ADMIN_SERVICE_URL;
const ASSET_SERVICE_BASE = import.meta.env.VITE_ASSET_SERVICE_URL;

const PUBLIC_CAREERS_URL = `${ADMIN_SERVICE_BASE}/api/public/careers`;
const PUBLIC_ASSETS_URL = `${ASSET_SERVICE_BASE}/api/assets`;

export const publicCareerApi = {
    // Get OPEN jobs
    getOpenJobs: async () => {
        const response = await axios.get(`${PUBLIC_CAREERS_URL}/jobs`);
        return response.data;
    },

    // Submit application
    submitApplication: async (data: {
        jobId: number;
        fullName: string;
        email: string;
        phone: string;
        resumeAssetUuid: string;
        portfolioAssetUuid?: string | null; // Added optional portfolio field
    }) => {
        const response = await axios.post(`${PUBLIC_CAREERS_URL}/apply`, data);
        return response.data;
    },

    // Upload Files to Asset Service
    // Note: Reusing the same endpoint for both Resume and Portfolio
    uploadResume: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${PUBLIC_ASSETS_URL}/resume-upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};