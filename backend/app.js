const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// 生成6位数字验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证手机号格式
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 认证路由
app.post('/auth/request-code', async (req, res) => {
  const { phone } = req.body;

  // 校验手机号格式
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号码' });
  }

  // TODO: 生成验证码并存储
  const code = generateCode();
  console.log(`手机号 ${phone} 的验证码是: ${code}`);
  
  res.json({ message: '验证码已发送' });
});

app.post('/auth/login', async (req, res) => {
  const { phone, code } = req.body;

  // 校验手机号格式
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号码' });
  }

  // TODO: 校验手机号是否已注册
  
  // TODO: 校验验证码是否正确
  
  // TODO: 生成登录令牌

  res.status(400).json({ error: '该手机号未注册，请先完成注册' });
});

module.exports = app;