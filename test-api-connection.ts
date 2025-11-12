/**
 * Script để kiểm tra kết nối API với backend
 * Chạy file này để test các API endpoints
 */

import axios from 'axios';
import { axiosAuthInstance, axiosInstance } from './utils/axiosInstance';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.31.143:8080/api/v1/";

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  statusCode?: number;
  message: string;
  data?: any;
  error?: any;
}

const testResults: TestResult[] = [];

const logResult = (result: TestResult): void => {
  testResults.push(result);
  const statusIcon = result.status === 'success' ? '✅' : '❌';
  console.log(`${statusIcon} [${result.method}] ${result.endpoint}`);
  console.log(`   Status: ${result.statusCode || 'N/A'}`);
  console.log(`   Message: ${result.message}`);
  if (result.data && __DEV__) {
    console.log(`   Data:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
  }
  if (result.error && __DEV__) {
    console.log(`   Error:`, result.error);
  }
  console.log('');
};

/**
 * Test 1: Kiểm tra kết nối cơ bản với backend
 */
export const testBasicConnection = async (): Promise<void> => {
  console.log('🔍 Test 1: Kiểm tra kết nối cơ bản...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}health`, {
      timeout: 5000,
    });
    logResult({
      endpoint: 'health',
      method: 'GET',
      status: 'success',
      statusCode: response.status,
      message: 'Backend đang hoạt động',
      data: response.data,
    });
  } catch (error: any) {
    // Health endpoint có thể không tồn tại, thử endpoint khác
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logResult({
        endpoint: 'health',
        method: 'GET',
        status: 'error',
        message: `Không thể kết nối đến ${API_BASE_URL}. Kiểm tra lại IP và port.`,
        error: error.message,
      });
    } else {
      // Có thể endpoint không tồn tại nhưng server đang chạy
      logResult({
        endpoint: 'health',
        method: 'GET',
        status: error.response ? 'success' : 'error',
        statusCode: error.response?.status,
        message: error.response 
          ? 'Server đang chạy (endpoint health có thể không tồn tại)' 
          : 'Không thể kết nối đến server',
        error: error.message,
      });
    }
  }
};

/**
 * Test 2: Test API đăng ký (không cần auth)
 */
export const testRegisterAPI = async (): Promise<void> => {
  console.log('🔍 Test 2: Kiểm tra API đăng ký...\n');
  
  const timestamp = Date.now();
  const testData = {
    fullName: `Test User ${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'Test123456',
    address: '123 Test Street, Test City',
    gender: 'MALE',
    dateOfBirth: '1990-01-01',
  };

  try {
    const response = await axiosAuthInstance.post('auth/register', testData);
    logResult({
      endpoint: 'auth/register',
      method: 'POST',
      status: 'success',
      statusCode: response.status,
      message: 'API đăng ký hoạt động bình thường',
      data: {
        success: response.data?.success,
        hasToken: !!(response.data?.data?.token || response.data?.data?.accessToken),
        hasUserId: !!(response.data?.data?.userId || response.data?.data?.user?.id),
      },
    });
  } catch (error: any) {
    logResult({
      endpoint: 'auth/register',
      method: 'POST',
      status: 'error',
      statusCode: error.response?.status,
      message: error.response?.data?.message || error.message,
      error: {
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
};

/**
 * Test 3: Test API đăng nhập
 */
export const testLoginAPI = async (usernameOrEmail: string, password: string): Promise<string | null> => {
  console.log('🔍 Test 3: Kiểm tra API đăng nhập...\n');
  
  try {
    const response = await axiosAuthInstance.post('auth/login', {
      usernameOrEmail,
      password,
    });
    
    const token = response.data?.data?.token || 
                  response.data?.data?.accessToken || 
                  response.data?.token;
    
    logResult({
      endpoint: 'auth/login',
      method: 'POST',
      status: 'success',
      statusCode: response.status,
      message: 'API đăng nhập hoạt động bình thường',
      data: {
        success: response.data?.success,
        hasToken: !!token,
        hasRefreshToken: !!(response.data?.data?.refreshToken || response.data?.refreshToken),
        hasUserId: !!(response.data?.data?.userId || response.data?.data?.user?.id),
        responseStructure: Object.keys(response.data || {}),
      },
    });
    
    return token || null;
  } catch (error: any) {
    logResult({
      endpoint: 'auth/login',
      method: 'POST',
      status: 'error',
      statusCode: error.response?.status,
      message: error.response?.data?.message || error.message,
      error: {
        status: error.response?.status,
        data: error.response?.data,
      },
    });
    return null;
  }
};

/**
 * Test 4: Test API lấy danh sách phòng (có thể cần auth)
 */
export const testGetRoomsAPI = async (token?: string): Promise<void> => {
  console.log('🔍 Test 4: Kiểm tra API lấy danh sách phòng...\n');
  
  try {
    const config = token ? {
      headers: { Authorization: `Bearer ${token}` }
    } : {};
    
    const response = await axiosInstance.get('/rooms', config);
    
    logResult({
      endpoint: '/rooms',
      method: 'GET',
      status: 'success',
      statusCode: response.status,
      message: 'API lấy danh sách phòng hoạt động bình thường',
      data: {
        success: response.data?.success,
        dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
        itemCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
        firstItem: Array.isArray(response.data?.data) && response.data.data.length > 0 
          ? Object.keys(response.data.data[0] || {}) 
          : [],
      },
    });
  } catch (error: any) {
    logResult({
      endpoint: '/rooms',
      method: 'GET',
      status: 'error',
      statusCode: error.response?.status,
      message: error.response?.status === 401 
        ? 'API yêu cầu authentication' 
        : error.response?.data?.message || error.message,
      error: {
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
};

/**
 * Test 5: Test API lấy best rooms
 */
export const testGetBestRoomsAPI = async (token?: string): Promise<void> => {
  console.log('🔍 Test 5: Kiểm tra API lấy best rooms...\n');
  
  try {
    const config = token ? {
      headers: { Authorization: `Bearer ${token}` }
    } : {};
    
    const response = await axiosInstance.get('/rooms/best-room', config);
    
    logResult({
      endpoint: '/rooms/best-room',
      method: 'GET',
      status: 'success',
      statusCode: response.status,
      message: 'API lấy best rooms hoạt động bình thường',
      data: {
        success: response.data?.success,
        dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
        itemCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
      },
    });
  } catch (error: any) {
    logResult({
      endpoint: '/rooms/best-room',
      method: 'GET',
      status: 'error',
      statusCode: error.response?.status,
      message: error.response?.data?.message || error.message,
      error: {
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
};

/**
 * Test 6: Test API lấy best hotels
 */
export const testGetBestHotelsAPI = async (token?: string): Promise<void> => {
  console.log('🔍 Test 6: Kiểm tra API lấy best hotels...\n');
  
  try {
    const config = token ? {
      headers: { Authorization: `Bearer ${token}` }
    } : {};
    
    const response = await axiosInstance.get('/hotels/best', config);
    
    logResult({
      endpoint: '/hotels/best',
      method: 'GET',
      status: 'success',
      statusCode: response.status,
      message: 'API lấy best hotels hoạt động bình thường',
      data: {
        success: response.data?.success,
        dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
        itemCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
      },
    });
  } catch (error: any) {
    logResult({
      endpoint: '/hotels/best',
      method: 'GET',
      status: 'error',
      statusCode: error.response?.status,
      message: error.response?.data?.message || error.message,
      error: {
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
};

/**
 * Test 7: Test API filter rooms
 */
export const testFilterRoomsAPI = async (token?: string): Promise<void> => {
  console.log('🔍 Test 7: Kiểm tra API filter rooms...\n');
  
  try {
    const config = token ? {
      headers: { Authorization: `Bearer ${token}` }
    } : {};
    
    const response = await axiosInstance.get('/rooms/filter?sortBy=price_asc', config);
    
    logResult({
      endpoint: '/rooms/filter',
      method: 'GET',
      status: 'success',
      statusCode: response.status,
      message: 'API filter rooms hoạt động bình thường',
      data: {
        success: response.data?.success,
        dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
        itemCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
      },
    });
  } catch (error: any) {
    logResult({
      endpoint: '/rooms/filter',
      method: 'GET',
      status: 'error',
      statusCode: error.response?.status,
      message: error.response?.data?.message || error.message,
      error: {
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
};

/**
 * Chạy tất cả các test
 */
export const runAllTests = async (testUsernameOrEmail?: string, testPassword?: string): Promise<void> => {
  console.log('🚀 Bắt đầu kiểm tra kết nối API với backend...\n');
  console.log(`📍 Base URL: ${API_BASE_URL}\n`);
  console.log('='.repeat(60) + '\n');

  // Test 1: Basic connection
  await testBasicConnection();

  // Test 2: Register API
  await testRegisterAPI();

  // Test 3: Login API (nếu có thông tin đăng nhập)
  let token: string | null = null;
  if (testUsernameOrEmail && testPassword) {
    token = await testLoginAPI(testUsernameOrEmail, testPassword);
  } else {
    console.log('⚠️  Bỏ qua test đăng nhập (chưa có thông tin đăng nhập)\n');
  }

  // Test 4-7: Protected/public APIs
  await testGetRoomsAPI(token || undefined);
  await testGetBestRoomsAPI(token || undefined);
  await testGetBestHotelsAPI(token || undefined);
  await testFilterRoomsAPI(token || undefined);

  // Tổng kết
  console.log('='.repeat(60));
  console.log('\n📊 TỔNG KẾT:\n');
  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  console.log(`✅ Thành công: ${successCount}/${testResults.length}`);
  console.log(`❌ Lỗi: ${errorCount}/${testResults.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Các endpoint có lỗi:');
    testResults
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`   - ${r.method} ${r.endpoint}: ${r.message}`);
      });
  }
  
  console.log('\n💡 Lưu ý:');
  console.log('   - Nếu thấy lỗi ECONNREFUSED: Kiểm tra IP và port của backend');
  console.log('   - Nếu thấy lỗi 401: API yêu cầu đăng nhập trước');
  console.log('   - Nếu thấy lỗi 404: Endpoint có thể không tồn tại hoặc đường dẫn sai');
  console.log('   - Kiểm tra file .env hoặc EXPO_PUBLIC_API_URL trong app.json\n');
};

// Export để có thể import và chạy
export default {
  runAllTests,
  testBasicConnection,
  testRegisterAPI,
  testLoginAPI,
  testGetRoomsAPI,
  testGetBestRoomsAPI,
  testGetBestHotelsAPI,
  testFilterRoomsAPI,
};


