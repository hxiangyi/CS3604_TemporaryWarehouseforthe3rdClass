import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../src/pages/Login'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock API functions
vi.mock('../../src/utils/api', () => ({
  requestCode: vi.fn(),
  login: vi.fn()
}))

describe('登录页面', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
  }

  describe('手机号验证', () => {
    it('空手机号提示错误', async () => {
      renderLogin()
      const getCodeButton = screen.getByText('获取验证码')
      await userEvent.click(getCodeButton)
      expect(screen.getByText('请输入手机号')).toBeInTheDocument()
    })

    it('无效手机号提示错误', async () => {
      renderLogin()
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      await userEvent.type(phoneInput, '1234')
      const getCodeButton = screen.getByText('获取验证码')
      await userEvent.click(getCodeButton)
      expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument()
    })
  })

  describe('验证码请求', () => {
    it('成功请求验证码后显示倒计时', async () => {
      const { requestCode } = await import('../../src/utils/api')
      requestCode.mockResolvedValueOnce({ message: '验证码已发送', seconds: 60 })

      renderLogin()
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const getCodeButton = screen.getByText('获取验证码')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.click(getCodeButton)

      await waitFor(() => {
        expect(screen.getByText('60秒后重试')).toBeInTheDocument()
      })
    })

    it('请求验证码失败显示错误信息', async () => {
      const { requestCode } = await import('../../src/utils/api')
      requestCode.mockRejectedValueOnce(new Error('请输入正确的手机号'))

      renderLogin()
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const getCodeButton = screen.getByText('获取验证码')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.click(getCodeButton)

      await waitFor(() => {
        expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument()
      })
    })
  })

  describe('登录提交', () => {
    it('登录成功后跳转到首页', async () => {
      const { login } = await import('../../src/utils/api')
      login.mockResolvedValueOnce({ message: '登录成功' })

      renderLogin()
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const submitButton = screen.getByText('登录')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '123456')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })

    it('未注册手机号显示错误信息', async () => {
      const { login } = await import('../../src/utils/api')
      login.mockRejectedValueOnce(new Error('该手机号未注册，请先完成注册'))

      renderLogin()
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const submitButton = screen.getByText('登录')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '123456')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('该手机号未注册，请先完成注册')).toBeInTheDocument()
      })
    })

    it('验证码错误显示错误信息', async () => {
      const { login } = await import('../../src/utils/api')
      login.mockRejectedValueOnce(new Error('验证码错误'))

      renderLogin()
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const submitButton = screen.getByText('登录')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '000000')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('验证码错误')).toBeInTheDocument()
      })
    })
  })
})