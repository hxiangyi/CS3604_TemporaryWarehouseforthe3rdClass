const request = require('supertest');
const app = require('../app');
const { initDb, getDb } = require('../db');

describe('认证接口测试', () => {
  beforeAll(async () => {
    // 使用内存数据库进行测试
    process.env.DB_PATH = ':memory:';
    await initDb();
  });

  beforeEach(async () => {
    const db = await getDb();
    // 清空测试数据
    await db.exec('DELETE FROM users');
    await db.exec('DELETE FROM verification_codes');
    await db.close();
  });

  describe('POST /auth/request-code', () => {
    test('手机号格式无效时应返回错误', async () => {
      const res = await request(app)
        .post('/auth/request-code')
        .send({ phone: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('请输入正确的手机号码');
    });

    test('手机号格式正确时应生成验证码', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const phone = '13800138000';

      const res = await request(app)
        .post('/auth/request-code')
        .send({ phone });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('验证码已发送');
      expect(res.body.seconds).toBe(60);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`手机号 ${phone} 的验证码是: \\d{6}`))
      );

      consoleSpy.mockRestore();
    });

    test('验证码应在60秒内有效', async () => {
      const phone = '13800138000';
      const consoleSpy = jest.spyOn(console, 'log');

      // 请求验证码
      await request(app)
        .post('/auth/request-code')
        .send({ phone });

      // 从控制台输出中提取验证码
      const match = consoleSpy.mock.calls[0][0].match(/验证码是: (\d{6})/);
      const code = match[1];

      // 立即使用验证码注册（应成功）
      const res1 = await request(app)
        .post('/auth/register')
        .send({ phone, code, agree: true });
      expect(res1.status).toBe(200);

      // 清理数据
      const db = await getDb();
      await db.exec('DELETE FROM users');
      await db.exec('DELETE FROM verification_codes');
      await db.close();

      // 再次请求验证码
      await request(app)
        .post('/auth/request-code')
        .send({ phone });

      // 模拟等待61秒
      const now = new Date();
      const futureDate = new Date(now.getTime() + 61000);
      const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => futureDate.getTime());

      // 使用验证码注册（应失败）
      const res2 = await request(app)
        .post('/auth/register')
        .send({ phone, code, agree: true });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('验证码已过期');

      // 恢复 mock
      consoleSpy.mockRestore();
      dateSpy.mockRestore();
    });
  });

  describe('POST /auth/login', () => {
    test('手机号格式无效时应返回错误', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ phone: '123', code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('请输入正确的手机号码');
    });

    test('未注册手机号应返回错误', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ phone: '13800138000', code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('该手机号未注册，请先完成注册');
    });

    test('验证码错误应返回错误', async () => {
      const phone = '13800138000';
      
      // 先注册用户
      const db = await getDb();
      await db.run('INSERT INTO users (phone) VALUES (?)', [phone]);
      await db.close();

      const res = await request(app)
        .post('/auth/login')
        .send({ phone, code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('验证码错误');
    });

    test('登录成功应返回成功消息', async () => {
      const phone = '13800138000';
      const consoleSpy = jest.spyOn(console, 'log');

      // 先注册用户
      const db = await getDb();
      await db.run('INSERT INTO users (phone) VALUES (?)', [phone]);
      await db.close();

      // 请求验证码
      await request(app)
        .post('/auth/request-code')
        .send({ phone });

      // 从控制台输出中提取验证码
      const match = consoleSpy.mock.calls[0][0].match(/验证码是: (\d{6})/);
      const code = match[1];

      // 使用验证码登录
      const res = await request(app)
        .post('/auth/login')
        .send({ phone, code });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('登录成功');

      consoleSpy.mockRestore();
    });
  });

  describe('POST /auth/register', () => {
    test('手机号格式无效时应返回错误', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ phone: '123', code: '123456', agree: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('请输入正确的手机号码');
    });

    test('未同意用户协议应返回错误', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ phone: '13800138000', code: '123456', agree: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('请先同意《淘贝用户协议》');
    });

    test('验证码错误应返回错误', async () => {
      const phone = '13800138000';

      // 请求验证码
      await request(app)
        .post('/auth/request-code')
        .send({ phone });

      // 使用错误的验证码注册
      const res = await request(app)
        .post('/auth/register')
        .send({ phone, code: '000000', agree: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('验证码错误');
    });

    test('已注册手机号应直接登录', async () => {
      const phone = '13800138000';
      const consoleSpy = jest.spyOn(console, 'log');

      // 先注册用户
      const db = await getDb();
      await db.run('INSERT INTO users (phone) VALUES (?)', [phone]);
      await db.close();

      // 请求验证码
      await request(app)
        .post('/auth/request-code')
        .send({ phone });

      // 从控制台输出中提取验证码
      const match = consoleSpy.mock.calls[0][0].match(/验证码是: (\d{6})/);
      const code = match[1];

      // 使用已注册手机号注册
      const res = await request(app)
        .post('/auth/register')
        .send({ phone, code, agree: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('该手机号已注册，将直接为您登录');

      consoleSpy.mockRestore();
    });

    test('注册成功应创建新用户', async () => {
      const phone = '13800138000';
      const consoleSpy = jest.spyOn(console, 'log');

      // 请求验证码
      await request(app)
        .post('/auth/request-code')
        .send({ phone });

      // 从控制台输出中提取验证码
      const match = consoleSpy.mock.calls[0][0].match(/验证码是: (\d{6})/);
      const code = match[1];

      // 注册新用户
      const res = await request(app)
        .post('/auth/register')
        .send({ phone, code, agree: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('注册成功');

      // 验证用户是否已创建
      const db = await getDb();
      const user = await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
      await db.close();

      expect(user).toBeTruthy();
      expect(user.phone).toBe(phone);

      consoleSpy.mockRestore();
    });
  });
});