import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestCode, login, register } from '../../src/utils/api'

global.fetch = vi.fn()

describe('API 函数测试', () => {
  beforeEach(() => {
    fetch.mockReset()
  })

  describe('requestCode', () => {
    it('成功请求验证码', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: '验证码已发送', seconds: 60 })
      })

      const result = await requestCode('13800138000')
      expect(result).toEqual({ message: '验证码已发送', seconds: 60 })
    })

    it('手机号格式错误', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '请输入正确的手机号' })
      })

      await expect(requestCode('1234')).rejects.toThrow('请输入正确的手机号')
    })

    it('网络错误处理', async () => {
      fetch.mockRejectedValueOnce(new Error('Failed to fetch'))
      await expect(requestCode('13800138000')).rejects.toThrow('请求失败')
    })
  })

  describe('login', () => {
    it('登录成功', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: '登录成功' })
      })

      const result = await login({ phone: '13800138000', code: '123456' })
      expect(result).toEqual({ message: '登录成功' })
    })

    it('未注册手机号', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '该手机号未注册，请先完成注册' })
      })

      await expect(login({ phone: '13800138000', code: '123456' }))
        .rejects.toThrow('该手机号未注册，请先完成注册')
    })

    it('验证码错误', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '验证码错误' })
      })

      await expect(login({ phone: '13800138000', code: '000000' }))
        .rejects.toThrow('验证码错误')
    })

    it('验证码过期', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '验证码已过期' })
      })

      await expect(login({ phone: '13800138000', code: '123456' }))
        .rejects.toThrow('验证码已过期')
    })
  })

  describe('register', () => {
    it('注册成功', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: '注册成功' })
      })

      const result = await register('13800138000', '123456')
      expect(result).toEqual({ message: '注册成功' })
    })

    it('已注册用户', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: '该手机号已注册，将直接为您登录' })
      })

      const result = await register('13800138000', '123456')
      expect(result).toEqual({ message: '该手机号已注册，将直接为您登录' })
    })

    it('验证码错误', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '验证码错误' })
      })

      await expect(register('13800138000', '000000'))
        .rejects.toThrow('验证码错误')
    })

    it('验证码过期', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '验证码已过期' })
      })

      await expect(register('13800138000', '123456'))
        .rejects.toThrow('验证码已过期')
    })
  })
})