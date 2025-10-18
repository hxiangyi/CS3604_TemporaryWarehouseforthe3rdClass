const API_BASE_URL = 'http://localhost:3000'

/**
 * 发送API请求
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise<any>} 响应数据
 */
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

/**
 * 请求验证码
 * @param {string} phone - 手机号
 * @returns {Promise<void>}
 */
export async function requestCode(phone) {
  return request('/auth/request-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

/**
 * 登录
 * @param {Object} params - 登录参数
 * @param {string} params.phone - 手机号
 * @param {string} [params.code] - 验证码（验证码登录时必填）
 * @param {string} [params.password] - 密码（密码登录时必填）
 * @returns {Promise<Object>} 用户信息
 */
export async function login(params) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 注册
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @returns {Promise<Object>} 用户信息
 */
export async function register(phone, code) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  })
}