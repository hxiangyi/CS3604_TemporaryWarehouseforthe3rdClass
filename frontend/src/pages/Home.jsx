import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestCode, login, register } from '../utils/api';
import '../styles/home.css';

export default function Home() {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState('code'); // 'code' or 'password'
  const [isLogin, setIsLogin] = useState(true); // true for login, false for register
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');
  const [agreement, setAgreement] = useState(false);

  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    setMessage('');
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    setMessage('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setMessage('');
  };

  const validatePhone = () => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setMessage('请输入正确的手机号码');
      return false;
    }
    return true;
  };

  const handleRequestCode = async () => {
    if (!validatePhone()) return;
    try {
      await requestCode(phone);
      setMessage('验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setMessage(error.message || '发送验证码失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhone()) return;

    try {
      if (isLogin) {
        // 登录逻辑
        if (loginMode === 'code') {
          if (!code) {
            setMessage('请输入验证码');
            return;
          }
          await login({ phone, code });
        } else {
          if (!password) {
            setMessage('请输入密码');
            return;
          }
          await login({ phone, password });
        }
        navigate('/');
      } else {
        // 注册逻辑
        if (!code) {
          setMessage('请输入验证码');
          return;
        }
        if (!agreement) {
          setMessage('请同意用户协议');
          return;
        }
        await register({ phone, code });
        navigate('/');
      }
    } catch (error) {
      setMessage(error.message || (isLogin ? '登录失败' : '注册失败'));
    }
  };

  return (
    <div className="home-container">
      <div className="auth-box">
        <div className="auth-tabs">
          <button
            className={`tab-button ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setMessage('');
            }}
          >
            登录
          </button>
          <button
            className={`tab-button ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setMessage('');
            }}
          >
            注册
          </button>
        </div>

        {isLogin && (
          <div className="login-mode-switch">
            <button
              className={`mode-button ${loginMode === 'code' ? 'active' : ''}`}
              onClick={() => setLoginMode('code')}
            >
              验证码登录
            </button>
            <button
              className={`mode-button ${loginMode === 'password' ? 'active' : ''}`}
              onClick={() => setLoginMode('password')}
            >
              密码登录
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="请输入手机号"
              className="form-input"
            />
          </div>

          {(loginMode === 'code' || !isLogin) && (
            <div className="form-group code-group">
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
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
          )}

          {isLogin && loginMode === 'password' && (
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="请输入密码"
                className="form-input"
              />
            </div>
          )}

          {!isLogin && (
            <div className="form-group agreement">
              <label>
                <input
                  type="checkbox"
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                />
                同意用户协议和隐私政策
              </label>
            </div>
          )}

          {message && <div className="message">{message}</div>}

          <button type="submit" className="submit-button">
            {isLogin ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
}