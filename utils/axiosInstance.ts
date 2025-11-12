// axiosInstance.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

// Lấy base URL từ biến môi trường
// Để sử dụng: Tạo file .env trong root directory với nội dung:
// EXPO_PUBLIC_API_URL=http://your-ip:8080/api/v1/
const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_URL || "http://192.168.31.87:8080/api/v1/";

// Đảm bảo baseURL kết thúc bằng dấu /
const getBaseURL = (): string => {
    const url = API_BASE_URL.trim();
    return url.endsWith('/') ? url : `${url}/`;
};

const BASE_URL = getBaseURL();

// Export BASE_URL để có thể sử dụng ở nơi khác nếu cần
export { BASE_URL };

// Log base URL trong development mode
if (__DEV__) {
    console.log('API Base URL:', BASE_URL);
    console.log('Environment variable EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || 'Not set (using default)');
}

let accessToken: string | null = null;

export const initializeAxiosToken = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    setAccessToken(token);
};

// Axios instances
export const axiosAuthInstance = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000, // 30 seconds timeout
});

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000, // 30 seconds timeout
});

// Interceptor request
axiosInstance.interceptors.request.use(async (config) => {
    // Đảm bảo headers object tồn tại
    if (!config.headers) {
        config.headers = {} as any;
    }

    // Nếu không có accessToken trong memory, thử load từ AsyncStorage
    if (!accessToken) {
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (token) {
                setAccessToken(token);
                if (__DEV__) {
                    console.log('Request interceptor - Token loaded from AsyncStorage');
                }
            }
        } catch (error) {
            if (__DEV__) {
                console.warn('Request interceptor - Failed to load token from AsyncStorage:', error);
            }
        }
    }

    // Nếu có accessToken, thêm vào header
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        if (__DEV__) {
            console.log('Request interceptor - Token added:', {
                url: config.url,
                hasToken: !!accessToken,
                tokenPreview: accessToken.substring(0, 20) + '...',
                headers: Object.keys(config.headers),
            });
        }
    } else {
        // Nếu không có accessToken nhưng có Authorization trong config, giữ nguyên
        if (!config.headers.Authorization) {
            if (__DEV__) {
                console.warn('Request interceptor - No token available:', {
                    url: config.url,
                    hasConfigAuth: !!config.headers.Authorization,
                });
            }
        }
    }

    if (__DEV__) {
        console.log('Request interceptor - Final headers:', {
            url: config.url,
            hasAuthorization: !!config.headers.Authorization,
            allHeaders: Object.keys(config.headers),
        });
    }

    return config;
});

// Setter cho token
export const setAccessToken = (token: string | null) => {
    accessToken = token;
    if (token) {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete axiosInstance.defaults.headers.common.Authorization;
    }
};

// Interceptor response (xử lý refresh token)
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem("refreshToken");
                // Sử dụng BASE_URL từ biến môi trường
                const response = await axios.post(`${BASE_URL}auth/refresh-token`, { refreshToken });

                const newAccessToken = response?.data?.accessToken;
                if (newAccessToken) {
                    await AsyncStorage.setItem("accessToken", newAccessToken);
                    setAccessToken(newAccessToken);
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // Clear tokens on refresh failure
                await AsyncStorage.removeItem("accessToken");
                await AsyncStorage.removeItem("refreshToken");
                setAccessToken(null);
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors (403, 404, 500, etc.)
        const errorMessage = getErrorMessage(error);
        return Promise.reject({ ...error, userMessage: errorMessage });
    }
);

// Add error interceptor for axiosAuthInstance as well
axiosAuthInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle errors for auth endpoints
        const errorMessage = getErrorMessage(error);
        return Promise.reject({ ...error, userMessage: errorMessage });
    }
);

// Helper function to clean server messages
const cleanServerMessage = (message: string | undefined): string | null => {
    if (!message || typeof message !== 'string') {
        return null;
    }

    // Remove technical patterns more aggressively
    let cleaned = message
        .replace(/^(AxiosError|Error|Request failed|NetworkError|TypeError):\s*/i, '')
        .replace(/Request failed with status code \d+/i, '')
        .replace(/AxiosError:\s*/gi, '')
        .replace(/\[.*?AxiosError.*?\]/gi, '')
        .replace(/Request failed with status code/gi, '')
        .replace(/status code \d+/gi, '')
        .replace(/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECODE/gi, '')
        .replace(/Network request failed/gi, '')
        .replace(/timeout of \d+ms exceeded/gi, '')
        .trim();

    // Check if still technical
    const lower = cleaned.toLowerCase();
    if (lower.includes('axioserror') ||
        lower.includes('request failed') ||
        lower.includes('status code') ||
        lower.includes('axios') ||
        lower.includes('network error') ||
        /^\d{3}/.test(cleaned) ||
        /error:\s*$/i.test(cleaned)) {
        return null;
    }

    return cleaned.length > 3 ? cleaned : null;
};

// Helper function to extract error message
const getErrorMessage = (error: AxiosError): string => {
    if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data as any;

        // For authentication errors (401, 403), check for user-friendly message first
        if (status === 401 || status === 403) {
            // Try to get message from errors.message (server-specific format)
            const errorsMessage = data?.errors?.message;
            if (errorsMessage && typeof errorsMessage === 'string') {
                const cleaned = cleanServerMessage(errorsMessage);
                if (cleaned && !isTechnicalMessage(cleaned)) {
                    return cleaned;
                }
            }

            // Try to get message from data.message
            const serverMessage = cleanServerMessage(data?.message);
            if (serverMessage && !isTechnicalMessage(serverMessage)) {
                return serverMessage;
            }

            // Fallback to default friendly message
            if (status === 401) {
                return 'Tên đăng nhập hoặc mật khẩu không đúng.';
            }
            return 'Bạn không có quyền truy cập.';
        }

        // For other errors, try to get clean message from server
        const serverMessage = cleanServerMessage(data?.message) ||
            cleanServerMessage(data?.error) ||
            cleanServerMessage(data?.errors?.message);
        if (serverMessage && !isTechnicalMessage(serverMessage)) {
            return serverMessage;
        }

        // Fallback to status-based messages
        switch (status) {
            case 400:
                return 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
            case 404:
                return 'Không tìm thấy tài nguyên.';
            case 422:
                return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
            case 500:
                return 'Lỗi máy chủ. Vui lòng thử lại sau.';
            case 503:
                return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
            default:
                return 'Đã xảy ra lỗi. Vui lòng thử lại.';
        }
    } else if (error.request) {
        // Request was made but no response received
        return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
    } else {
        // Something else happened - don't show technical error.message
        return 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
};

// Helper to check if message is technical (used in getErrorMessage)
const isTechnicalMessage = (message: string): boolean => {
    if (!message || typeof message !== 'string') {
        return true;
    }
    const lower = message.toLowerCase();
    return lower.includes('axioserror') ||
        lower.includes('request failed') ||
        lower.includes('status code') ||
        /^\d{3}/.test(message.trim());
};

export default axiosInstance;