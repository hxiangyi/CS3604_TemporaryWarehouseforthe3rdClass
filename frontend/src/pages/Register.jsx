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
    if (!isValidPhone(phone)) {
      setMessage('请输入正确的手机号')
      return
    }

    try {
      await requestCode(phone)
      setMessage('验证码已发送')
      setCountdown(60)
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
    if (!isValidPhone(phone)) {
      setMessage('请输入正确的手机号')
      return
    }
    if (!code) {
      setMessage('请输入验证码')
      return
    }
    if (!agree) {
      setMessage('请同意用户协议')
      return
    }

    try {
      await register(phone, code)
      navigate('/')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="auth-container">
      <h2>注册</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
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
        <div className="form-group">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="请输入验证码"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="agreement">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>同意《淘贝用户协议》</span>
          </label>
        </div>
        <button type="submit" className="submit-button" disabled={!agree}>
          注册
        </button>
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  )
}