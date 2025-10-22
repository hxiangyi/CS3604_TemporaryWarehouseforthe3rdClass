import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';
import { login, register, requestCode, verifyToken } from '../utils/api';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // 自动登录：检查本地存储的 token
  useEffect(() => {
    const checkAutoLogin = async () => {
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        try {
          const response = await verifyToken(savedToken);
          setCurrentUser(response.user);
          setMessage(`欢迎回来，${response.user.phone}`);
        } catch (error) {
          // Token 无效或过期，清除本地存储
          localStorage.removeItem('authToken');
        }
      }
      setIsAutoLoggingIn(false);
    };

    checkAutoLogin();
  }, []);

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setMessage('已退出登录');
    setPhone('');
    setCode('');
    setPassword('');
    setRememberMe(false);
  };

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
          const response = await login({ phone, code, rememberMe });

          // 如果勾选了"记住我"且返回了 token，保存到本地
          if (rememberMe && response.token) {
            localStorage.setItem('authToken', response.token);
          }

          setCurrentUser(response.user);
          setMessage('登录成功');
        } else {
          if (!password) {
            setMessage('请输入密码');
            return;
          }
          await login({ phone, password });
        }
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
        const response = await register({ phone, code, agree: agreement, rememberMe });

        // 如果勾选了"记住我"且返回了 token，保存到本地
        if (rememberMe && response.token) {
          localStorage.setItem('authToken', response.token);
        }

        setCurrentUser(response.user);
        setMessage(response.message || '注册成功');
      }
    } catch (error) {
      setMessage(error.message || (isLogin ? '登录失败' : '注册失败'));
    }
  };

  // 如果正在自动登录，显示加载状态
  if (isAutoLoggingIn) {
    return (
      <div className="home-container">
        <div className="auth-box">
          <div className="loading">正在加载...</div>
        </div>
      </div>
    );
  }

  // 如果已登录，显示欢迎页面
  if (currentUser) {
    return (
      <div className="home-container">
        <div className="auth-box">
          <h2>欢迎回来！</h2>
          <p>您已登录，手机号：{currentUser.phone}</p>
          {message && <div className="message success">{message}</div>}
          <button onClick={handleLogout} className="submit-button">
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="auth-box">
        <div className="auth-tabs">
          <button
            className={`tab-button ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setMessage('');
              setCode('');
              setCountdown(0);
            }}
          >
            登录
          </button>
          <button
            className={`tab-button ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setMessage('');
              setCode('');
              setCountdown(0);
            }}
          >
            注册
          </button>
        </div>

        {isLogin && (
          <div className="login-mode-switch">
            <button
              className={`mode-button ${loginMode === 'code' ? 'active' : ''}`}
              onClick={() => {
                setLoginMode('code');
                setCode('');
                setCountdown(0);
              }}
            >
              验证码登录
            </button>
            <button
              className={`mode-button ${loginMode === 'password' ? 'active' : ''}`}
              onClick={() => {
                setLoginMode('password');
                setCode('');
                setCountdown(0);
              }}
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

          <div className="form-group remember-me">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              记住我（7天内自动登录）
            </label>
          </div>

          {message && <div className="message">{message}</div>}

          <button type="submit" className="submit-button">
            {isLogin ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  );
}