import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // 验证手机号格式
  const isValidPhone = (phone) => /^1[3-9]\d{9}$/.test(phone);

  // 请求验证码
  const handleRequestCode = async () => {
    if (!isValidPhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '获取验证码失败');
      }

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // 提交登录
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!isValidPhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 登录成功
      localStorage.setItem('token', data.token);
      alert('登录成功');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const formWidth = 360; // 表单总宽度
  const codeButtonWidth = 120; // 获取验证码按钮宽度
  const gap = 8; // 手机号输入框和获取验证码按钮之间的间距

  return (
    <div className="login-page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      <h2 style={{ marginBottom: '24px' }}>登录</h2>
      <form onSubmit={handleLogin} style={{
        width: '100%',
        maxWidth: `${formWidth}px`
      }}>
        <div style={{
          display: 'flex',
          marginBottom: '16px',
          gap: `${gap}px`
        }}>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="请输入手机号"
            maxLength={11}
            style={{
              width: `${formWidth - codeButtonWidth - gap}px`,
              padding: '8px 12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button
            type="button"
            onClick={handleRequestCode}
            disabled={countdown > 0}
            style={{
              width: `${codeButtonWidth}px`,
              padding: '8px 16px',
              fontSize: '16px',
              backgroundColor: countdown > 0 ? '#ccc' : '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
          </button>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="请输入验证码"
            maxLength={6}
            style={{
              width: `${formWidth - 2}px`, // 减去边框宽度
              padding: '8px 12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        {error && <div style={{
          color: '#ff4d4f',
          marginBottom: '16px',
          fontSize: '14px'
        }}>{error}</div>}
        <button
          type="submit"
          style={{
            width: `${formWidth}px`,
            padding: '8px 16px',
            fontSize: '16px',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          登录
        </button>
      </form>
    </div>
  );
}