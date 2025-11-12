import axiosInstance, { axiosAuthInstance } from "@/utils/axiosInstance";

export interface registerData {
    fullName: string;
    email: string;
    password: string;
    address: string;
    gender: string;
    dateOfBirth: string;
    phone?: string;
}

export interface UserProfile {
    id?: string | number;
    username?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | string;
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateProfileData {
    email?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | string;
}
export const login = async (usernameOrEmail: string, password: string): Promise<any> => {
    try {
        const response = await axiosAuthInstance.post("auth/login", {
            usernameOrEmail,
            password,
        });
        return response.data;
    } catch (error: any) {
        console.log(error);

        throw error;
    }
};
export const register = async (registerData: registerData): Promise<any> => {
    try {
        const response = await axiosAuthInstance.post("auth/register", {
            ...registerData,
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};
export const sendRequestCode = async (email: string): Promise<any> => {
    try {
        const response = await axiosAuthInstance.post("auth/forget-password", {
            email,
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};
export const verifyCode = async (email: string, code: string): Promise<any> => {
    try {
        const trimmedEmail = email.trim();
        const trimmedCode = code.trim();
        if (__DEV__) {
            console.log('API verifyCode called with:', {
                email: trimmedEmail,
                code: trimmedCode,
                codeType: typeof trimmedCode,
                codeLength: trimmedCode.length,
            });
        }

        const response = await axiosAuthInstance.post("auth/verify-otp", {
            email: trimmedEmail,
            otp: trimmedCode,
        });
        return response.data;
    } catch (error: any) {
        if (__DEV__) {
            console.log('API verifyCode error:', {
                status: error?.response?.status,
                data: error?.response?.data,
                message: error?.message,
            });
        }
        throw error;
    }
};
export const resetPassword = async (email: string, newPassword: string, otp: string): Promise<any> => {
    try {
        const response = await axiosAuthInstance.post("auth/reset-password", {
            email,
            newPassword,
            otp,
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    try {
        if (__DEV__) {
            console.log('API getUserProfile request:', {
                url: `/users/${userId}`,
                userId,
                userIdType: typeof userId,
            });
        }

        const response = await axiosInstance.get(`/users/${userId}`);

        if (__DEV__) {
            console.log('API getUserProfile response:', {
                status: response.status,
                fullResponse: response.data,
                hasData: !!response.data,
                hasDataData: !!response?.data?.data,
                dataStructure: {
                    data: response?.data,
                    dataData: response?.data?.data,
                },
            });
        }

        // Xử lý nhiều format response có thể có
        const userData = response?.data?.data || response?.data?.content || response?.data || {};

        if (__DEV__) {
            console.log('API getUserProfile parsed data:', {
                userData,
                hasEmail: !!userData.email,
                hasFullName: !!userData.fullName,
                keys: Object.keys(userData),
            });
        }

        return userData;
    } catch (error: any) {
        if (__DEV__) {
            console.error('API getUserProfile error:', {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                message: error?.message,
                userId,
                url: `/users/${userId}`,
            });
        }
        throw error;
    }
};

export const updateUserProfile = async (userId: string, updateData: UpdateProfileData): Promise<UserProfile> => {
    try {
        if (__DEV__) {
            console.log('API updateUserProfile request:', {
                url: `/users/changeInformation/${userId}`,
                method: 'PUT',
                data: updateData,
                dataStringified: JSON.stringify(updateData),
                dateOfBirth: updateData.dateOfBirth,
                dateOfBirthType: typeof updateData.dateOfBirth,
                dateOfBirthLength: updateData.dateOfBirth?.length,
                dateOfBirthBytes: updateData.dateOfBirth ? Array.from(new TextEncoder().encode(updateData.dateOfBirth)) : null,
                userId,
            });
        }

        const response = await axiosInstance.put(`/users/changeInformation/${userId}`, updateData);

        if (__DEV__) {
            console.log('API updateUserProfile success:', {
                status: response.status,
                data: response.data,
            });
        }

        return response?.data?.data || response?.data || {};
    } catch (error: any) {
        if (__DEV__) {
            console.error('API updateUserProfile error:', {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                message: error?.message,
                requestUrl: `/users/${userId}`,
                requestData: updateData,
            });
        }
        throw error;
    }
};
export const checkTokenExpire = async (tokenCheck: string) => {
    try {
        const response = await axiosInstance.post("/auth/checkToken", tokenCheck);
        return response;
    } catch (error) {
        console.log('====================================');
        console.log(error);
        console.log('====================================');
    }
}
/**
 * Card interface matching backend CardResponse
 * @see com.todo.response.CardResponse
 */
export interface Card {
    id: number; // Long in Java
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
    cvv: string;
    balance: number; // BigDecimal in Java
    createdAt: string; // LocalDateTime in Java (ISO format)
    updatedAt: string; // LocalDateTime in Java (ISO format)
}

export interface GetListCartResponse {
    data: Card[];
    success: boolean;
    count: number;
}

export interface GetDetailResponse {
    data?: Card;
    success?: boolean;
    message?: string;
    [key: string]: any;
}

export interface CreateCardResponse {
    data?: Card;
    success?: boolean;
    message?: string;
    [key: string]: any;
}

export interface CreateCardRequest {
    idUser: number | string;
    nameUser: string;
}

export const getListCart = async (idUser: number): Promise<GetListCartResponse> => {
    try {
        if (__DEV__) {
            console.log('API getListCart request:', {
                url: `/cards/user/${idUser}/all`,
                idUser,
                idUserType: typeof idUser,
            });
        }

        const response = await axiosInstance.get<GetListCartResponse>(`/cards/user/${idUser}/all`);

        if (__DEV__) {
            console.log('API getListCart response:', {
                status: response.status,
                fullResponse: response.data,
                hasData: !!response.data,
                hasDataArray: !!response?.data?.data,
                cardCount: response?.data?.data?.length || 0,
            });
        }

        return response.data;
    } catch (error: any) {
        if (__DEV__) {
            console.error('API getListCart error:', {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                message: error?.message,
                idUser,
                url: `/cards/user/${idUser}/all`,
            });
        }
        throw error;
    }
};

export const getDetailCard = async (idCard: number | string): Promise<GetDetailResponse> => {
    try {
        if (__DEV__) {
            console.log('API getDetail request:', {
                url: `/cards/${idCard}`,
                idCard,
                idCardType: typeof idCard,
            });
        }

        const response = await axiosInstance.get<GetDetailResponse>(`/cards/${idCard}`);

        if (__DEV__) {
            console.log('API getDetail response:', {
                status: response.status,
                fullResponse: response.data,
                hasData: !!response.data,
                hasDataData: !!response?.data?.data,
            });
        }

        return response.data;
    } catch (error: any) {
        if (__DEV__) {
            console.error('API getDetail error:', {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                message: error?.message,
                idCard,
                url: `/cards/${idCard}`,
            });
        }
        throw error;
    }
};

export const createCard = async (idUser: number | string, nameUser: string): Promise<CreateCardResponse> => {
    try {
        const request: CreateCardRequest = {
            idUser,
            nameUser,
        };

        if (__DEV__) {
            console.log('API createCard request:', {
                url: '/cards',
                method: 'POST',
                data: request,
            });
        }

        const response = await axiosInstance.post<CreateCardResponse>('/cards', request);

        if (__DEV__) {
            console.log('API createCard response:', {
                status: response.status,
                fullResponse: response.data,
                hasData: !!response.data,
                hasDataData: !!response?.data?.data,
            });
        }

        return response.data;
    } catch (error: any) {
        if (__DEV__) {
            console.error('API createCard error:', {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                message: error?.message,
                request: { idUser, nameUser },
                url: '/cards',
            });
        }
        throw error;
    }
};