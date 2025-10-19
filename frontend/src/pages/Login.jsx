import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestCode, login } from '../utils/api'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')

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
      const response = await requestCode(phone)
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
    if (!code) {
      setMessage('请输入验证码')
      return
    }

    try {
      const response = await login({ phone, code })
      setMessage(response.message)
      navigate('/')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <div className="tab active">登录</div>
        <div className="tab" onClick={() => navigate('/register')}>注册</div>
      </div>
      <div className="auth-content">
        <div className="auth-type-tabs">
          <div className="type-tab active">验证码登录</div>
          <div className="type-tab">密码登录</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入验证码"
              className="form-input"
            />
            <button
              type="button"
              onClick={handleRequestCode}
              disabled={countdown > 0}
              className="code-button"
            >
              {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
            </button>
          </div>
          <button type="submit" className="submit-button">登录</button>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  )
}