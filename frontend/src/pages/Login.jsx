import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestCode, login } from '../utils/api'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [loginType, setLoginType] = useState('code') // 'code' 或 'password'

  // 清理定时器
  useEffect(() => {
    return () => {
      if (countdown > 0) {
        setCountdown(0)
      }
    }
  }, [])

  // 验证手机号格式
  const isValidPhone = (phone) => {
    return /^1\d{10}$/.test(phone)
  }

  // 请求验证码
  const handleRequestCode = async () => {
    if (!phone) {
      setMessage('请输入手机号')
      return
    }
    if (!isValidPhone(phone)) {
      setMessage('请输入正确的手机号')
      return
    }

    try {
      const response = await requestCode(phone, true) // 传入 isLogin = true
      setMessage(response.message)
      setCountdown(response.seconds)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      setMessage(error.message)
    }
  }

  // 提交登录
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!phone) {
      setMessage('请输入手机号')
      return
    }
    if (!isValidPhone(phone)) {
      setMessage('请输入正确的手机号')
      return
    }
    if (loginType === 'code') {
      if (!code) {
        setMessage('请输入验证码')
        return
      }
    } else {
      if (!password) {
        setMessage('请输入密码')
        return
      }
    }

    try {
      const response = await login({
        phone,
        code: loginType === 'code' ? code : undefined,
        password: loginType === 'password' ? password : undefined,
        loginType
      })
      setMessage(response.message)
      if (response.message === '登录成功') {
        setShowSuccess(true)
        // 延迟800ms后跳转
        setTimeout(() => {
          navigate('/')
        }, 800)
      }
    } catch (error) {
      setMessage(error.message)
    }
  }

  if (showSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>登录成功！</h2>
            <p>正在为您跳转到首页...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-tabs">
          <div className="tab active">登录</div>
          <div className="tab" onClick={() => navigate('/register')}>注册</div>
        </div>
        <div className="auth-type-tabs">
          <div
            className={`type-tab ${loginType === 'code' ? 'active' : ''}`}
            onClick={() => {
              setLoginType('code')
              setMessage('')
              setPassword('')
            }}
          >
            验证码登录
          </div>
          <div
            className={`type-tab ${loginType === 'password' ? 'active' : ''}`}
            onClick={() => {
              setLoginType('password')
              setMessage('')
              setCode('')
              setCountdown(0)
            }}
          >
            密码登录
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="form-input"
              data-testid="phone-input"
            />
          </div>
          {loginType === 'code' ? (
            <div className="form-group">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
                className="form-input"
                data-testid="code-input"
              />
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={countdown > 0}
                className="code-button"
                data-testid="request-code-button"
              >
                {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
              </button>
            </div>
          ) : (
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="form-input"
                data-testid="password-input"
              />
            </div>
          )}
          <button
            type="submit"
            className="submit-button"
            data-testid="submit-button"
          >
            登录
          </button>
        </form>
        {message && !showSuccess && <div className="message" data-testid="message">{message}</div>}
      </div>
    </div>
  )
}