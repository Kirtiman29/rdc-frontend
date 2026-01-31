import axios from 'axios';

const ADMIN_SERVICE_URL = "http://localhost:8080/api/public/careers";
const ASSET_SERVICE_URL = "http://localhost:8090/api/assets";

export const publicCareerApi = {
    // 🌍 Get only OPEN jobs from the backend
    getOpenJobs: () => axios.get(`${ADMIN_SERVICE_URL}/jobs`),

    // 📤 Submit application data to Admin Service
    submitApplication: (data: {
        jobId: number;
        fullName: string;
        email: string;
        phone: string;
        resumeAssetUuid: string;
    }) => axios.post(`${ADMIN_SERVICE_URL}/apply`, data),

    // 📄 Upload Resume to Asset Service (Port 8090)
    // ✅ FIXED: Points to /resume-upload which is permitted for public use
    uploadResume: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post(`${ASSET_SERVICE_URL}/resume-upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};