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
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`手机号 ${phone} 的验证码是: \\d{6}`))
      );

      consoleSpy.mockRestore();
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

    // TODO: 添加验证码错误和登录成功的测试用例
  });
});