/**
 * Sanitizes error messages to make them user-friendly
 * Removes technical details like "AxiosError", "Request failed", etc.
 */
export const sanitizeErrorMessage = (error: any): string => {
  // Priority 1: For authentication errors (401, 403), always use friendly message
  // This ensures login errors are never technical
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return getFriendlyErrorMessage(error.response.status);
  }

  // Priority 2: Use userMessage from axios interceptor (already sanitized)
  if (error?.userMessage && typeof error.userMessage === 'string') {
    // Double check to ensure it's not technical
    const cleaned = cleanMessage(error.userMessage);
    if (cleaned && !isTechnicalMessage(cleaned)) {
      return cleaned;
    }
    // If still technical, continue to next priority
  }

  // Priority 3: Check error.response.status and provide friendly messages
  if (error?.response?.status) {
    return getFriendlyErrorMessage(error.response.status);
  }

  // Priority 4: Use server response message (only if not technical)
  // Check multiple possible locations for error message
  const serverMessage = error?.response?.data?.errors?.message || 
                        error?.response?.data?.message || 
                        error?.response?.data?.error;
  if (serverMessage && typeof serverMessage === 'string') {
    // Clean up server message if it contains technical details
    const cleaned = cleanMessage(serverMessage);
    if (cleaned && !isTechnicalMessage(cleaned)) {
      return cleaned;
    }
  }

  // Priority 5: Check if error.message contains technical details
  if (error?.message && typeof error.message === 'string') {
    const cleaned = cleanMessage(error.message);
    // If the cleaned message is still technical, use generic message
    if (cleaned && !isTechnicalMessage(cleaned)) {
      return cleaned;
    }
  }

  // Priority 6: Generic fallback
  return getGenericErrorMessage(error);
};

/**
 * Cleans technical terms from error messages
 */
const cleanMessage = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Remove common technical prefixes and patterns
  let cleaned = message
    .replace(/^(AxiosError|Error|TypeError|NetworkError|Request failed):\s*/i, '')
    .replace(/Request failed with status code \d+/i, '')
    .replace(/Network request failed/i, '')
    .replace(/timeout of \d+ms exceeded/i, '')
    .replace(/AxiosError:\s*/gi, '')
    .replace(/\[.*?AxiosError.*?\]/gi, '')
    .replace(/Request failed with status code/gi, '')
    .replace(/status code \d+/gi, '')
    .replace(/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/gi, '')
    .trim();

  // Remove any remaining technical patterns
  if (cleaned.toLowerCase().includes('axioserror') || 
      cleaned.toLowerCase().includes('request failed') ||
      cleaned.match(/status code \d+/i)) {
    return '';
  }

  // If message is empty or too short, return empty
  if (!cleaned || cleaned.length < 3) {
    return '';
  }

  return cleaned;
};

/**
 * Checks if message contains technical details
 */
const isTechnicalMessage = (message: string): boolean => {
  if (!message || typeof message !== 'string') {
    return true;
  }

  const technicalTerms = [
    'axioserror',
    'request failed',
    'status code',
    'network error',
    'timeout',
    'econnrefused',
    'enotfound',
    'err_',
    'axios',
    'error:',
    'failed with',
    'http',
    'ecode',
    'econn',
    'etimedout',
  ];

  const lowerMessage = message.toLowerCase().trim();
  
  // Check if message starts with technical terms
  if (technicalTerms.some((term) => lowerMessage.startsWith(term))) {
    return true;
  }
  
  // Check if message contains technical patterns
  if (technicalTerms.some((term) => lowerMessage.includes(term))) {
    return true;
  }

  // Check for patterns like "Error: ..." or "AxiosError: ..."
  if (/^(error|axioserror|typeerror|networkerror):/i.test(lowerMessage)) {
    return true;
  }

  // Check for status code patterns
  if (/\d{3}\s*(error|failed|code)/i.test(lowerMessage)) {
    return true;
  }

  return false;
};

/**
 * Gets friendly error message based on HTTP status code
 */
const getFriendlyErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
    case 401:
      return 'Tên đăng nhập hoặc mật khẩu không đúng.';
    case 403:
      return 'Bạn không có quyền truy cập.';
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
};

/**
 * Gets generic error message based on error type
 */
const getGenericErrorMessage = (error: any): string => {
  // Check if it's a network error
  if (error?.request && !error?.response) {
    // Check for specific error codes
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra cấu hình API hoặc expose backend qua ngrok.';
    }
    if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
      return 'Kết nối quá lâu. Vui lòng kiểm tra kết nối internet và thử lại.';
    }
    if (error?.message?.includes('Network request failed')) {
      return 'Kết nối mạng thất bại. Vui lòng kiểm tra kết nối internet hoặc cấu hình API.';
    }
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
  }

  // Check if it's a timeout
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Kết nối quá lâu. Vui lòng thử lại.';
  }

  // Generic message
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

/**
 * Xử lý lỗi booking cụ thể dựa trên backend response
 * Backend có thể trả về các lỗi:
 * - User not found
 * - Room not found
 * - Room is not available
 * - Check-in date must be before check-out date
 * - Check-in date cannot be in the past
 * - Card not found for user
 * - Số dư không đủ
 */
export const getBookingErrorMessage = (error: any): string => {
  // Kiểm tra nếu là lỗi 403 (Forbidden) - thường là lỗi liên quan đến thanh toán/thẻ
  if (error?.response?.status === 403) {
    return 'Vui lòng kiểm tra số dư tài khoản. Số dư có thể không đủ để thanh toán.';
  }

  // Lấy message từ server response
  const serverMessage = error?.response?.data?.message || 
                        error?.response?.data?.error ||
                        error?.response?.data?.errors?.message;

  if (serverMessage && typeof serverMessage === 'string') {
    const message = serverMessage.toLowerCase();
    
    // User not found
    if (message.includes('user not found') || message.includes('không tìm thấy user')) {
      return 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.';
    }
    
    // Room not found
    if (message.includes('room not found') || message.includes('không tìm thấy phòng')) {
      return 'Không tìm thấy thông tin phòng. Vui lòng thử lại.';
    }
    
    // Room is not available
    if (message.includes('room is not available') || message.includes('phòng không khả dụng')) {
      return 'Phòng này hiện không còn trống. Vui lòng chọn phòng khác.';
    }
    
    // Check-in date validation
    if (message.includes('check-in date must be before check-out date') || 
        message.includes('ngày check-in phải trước ngày check-out')) {
      return 'Ngày nhận phòng phải trước ngày trả phòng.';
    }
    
    if (message.includes('check-in date cannot be in the past') || 
        message.includes('ngày check-in không thể trong quá khứ')) {
      return 'Ngày nhận phòng không thể là ngày trong quá khứ.';
    }
    
    // Card not found
    if (message.includes('card not found') || message.includes('không tìm thấy thẻ')) {
      return 'Không tìm thấy thông tin thẻ. Vui lòng thêm thẻ trước khi thanh toán.';
    }
    
    // Số dư không đủ - kiểm tra nhiều pattern
    if (message.includes('số dư không đủ') || 
        (message.includes('balance') && message.includes('insufficient')) ||
        message.includes('số dư') ||
        message.includes('không đủ') ||
        message.includes('insufficient balance') ||
        message.includes('balance insufficient')) {
      // Tìm số tiền trong message nếu có
      const balanceMatch = serverMessage.match(/yêu cầu:\s*([\d.,]+)/i) || 
                          serverMessage.match(/required:\s*([\d.,]+)/i);
      const currentMatch = serverMessage.match(/hiện có:\s*([\d.,]+)/i) || 
                          serverMessage.match(/current:\s*([\d.,]+)/i);
      
      if (balanceMatch && currentMatch) {
        return `Số dư không đủ. Yêu cầu: ${balanceMatch[1]}, Hiện có: ${currentMatch[1]}`;
      }
      return 'Vui lòng kiểm tra số dư tài khoản. Số dư có thể không đủ để thanh toán.';
    }
    
    // Invalid credentials - có thể là lỗi liên quan đến thanh toán
    if (message.includes('invalid credentials') || 
        message.includes('invalid') && (message.includes('payment') || message.includes('card'))) {
      return 'Vui lòng kiểm tra số dư tài khoản. Số dư có thể không đủ để thanh toán.';
    }
    
    // Trả về message gốc nếu không match với các pattern trên
    return cleanMessage(serverMessage) || 'Đã xảy ra lỗi khi đặt phòng. Vui lòng thử lại.';
  }
  
  // Nếu là lỗi 400, 422 (Bad Request, Unprocessable Entity) - có thể là lỗi validation hoặc thanh toán
  if (error?.response?.status === 400 || error?.response?.status === 422) {
    // Kiểm tra xem có phải là lỗi liên quan đến thanh toán không
    const errorData = error?.response?.data;
    if (errorData && (
      JSON.stringify(errorData).toLowerCase().includes('balance') ||
      JSON.stringify(errorData).toLowerCase().includes('số dư') ||
      JSON.stringify(errorData).toLowerCase().includes('payment') ||
      JSON.stringify(errorData).toLowerCase().includes('card')
    )) {
      return 'Vui lòng kiểm tra số dư tài khoản. Số dư có thể không đủ để thanh toán.';
    }
  }
  
  // Fallback về sanitizeErrorMessage
  return sanitizeErrorMessage(error);
};
