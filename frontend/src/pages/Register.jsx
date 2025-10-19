import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestCode, register } from '../utils/api'
import '../styles/auth.css'

export default function Register() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [agree, setAgree] = useState(false)
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

  // 提交注册
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
    if (!agree) {
      setMessage('请先同意《淘贝用户协议》')
      return
    }

    try {
      const response = await register({ phone, code, agree })
      setMessage(response.message)
      navigate('/')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <div className="tab" onClick={() => navigate('/login')}>登录</div>
        <div className="tab active">注册</div>
      </div>
      <div className="auth-content">
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
          <div className="form-group">
            <label className="agreement">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                data-testid="agree-checkbox"
              />
              <span>同意《淘贝用户协议》</span>
            </label>
          </div>
          <button
            type="submit"
            className="submit-button"
            disabled={!agree}
            data-testid="submit-button"
          >
            注册
          </button>
        </form>
        {message && <div className="message" data-testid="message">{message}</div>}
      </div>
    </div>
  )
}