import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from '../../src/pages/Register'

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
  register: vi.fn()
}))

describe('注册页面', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const renderRegister = () => {
    return render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
  }

  describe('手机号验证', () => {
    it('空手机号提示错误', async () => {
      renderRegister()
      const getCodeButton = screen.getByTestId('request-code-button')
      await userEvent.click(getCodeButton)
      expect(screen.getByTestId('message')).toHaveTextContent('请输入手机号')
    })

    it('无效手机号提示错误', async () => {
      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      await userEvent.type(phoneInput, '1234')
      const getCodeButton = screen.getByTestId('request-code-button')
      await userEvent.click(getCodeButton)
      expect(screen.getByTestId('message')).toHaveTextContent('请输入正确的手机号')
    })
  })

  describe('验证码请求', () => {
    it('成功请求验证码后显示倒计时', async () => {
      const { requestCode } = await import('../../src/utils/api')
      requestCode.mockResolvedValueOnce({ message: '验证码已发送', seconds: 60 })

      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeButton = screen.getByTestId('request-code-button')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.click(getCodeButton)

      await waitFor(() => {
        expect(getCodeButton).toHaveTextContent('60秒后重试')
      })
    })

    it('请求验证码失败显示错误信息', async () => {
      const { requestCode } = await import('../../src/utils/api')
      requestCode.mockRejectedValueOnce(new Error('请输入正确的手机号'))

      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeButton = screen.getByTestId('request-code-button')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.click(getCodeButton)

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('请输入正确的手机号')
      })
    })
  })

  describe('用户协议', () => {
    it('未勾选用户协议提示错误', async () => {
      const { register } = await import('../../src/utils/api')

      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      const codeInput = screen.getByTestId('code-input')
      const agreeCheckbox = screen.getByTestId('agree-checkbox')
      const submitButton = screen.getByTestId('submit-button')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '123456')
      
      // 先勾选复选框，使提交按钮可用
      await userEvent.click(agreeCheckbox)
      // 再取消勾选
      await userEvent.click(agreeCheckbox)
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('同意用户协议和隐私政策')
      })
    })
  })

  describe('注册提交', () => {
    it('注册成功后跳转到首页', async () => {
      const { register } = await import('../../src/utils/api')
      register.mockResolvedValueOnce({ message: '注册成功' })

      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      const codeInput = screen.getByTestId('code-input')
      const agreeCheckbox = screen.getByTestId('agree-checkbox')
      const submitButton = screen.getByTestId('submit-button')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '123456')
      await userEvent.click(agreeCheckbox)
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })

    it('已注册用户直接登录', async () => {
      const { register } = await import('../../src/utils/api')
      register.mockResolvedValueOnce({ message: '该手机号已注册，将直接为您登录' })

      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      const codeInput = screen.getByTestId('code-input')
      const agreeCheckbox = screen.getByTestId('agree-checkbox')
      const submitButton = screen.getByTestId('submit-button')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '123456')
      await userEvent.click(agreeCheckbox)
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })

    it('验证码错误显示错误信息', async () => {
      const { register } = await import('../../src/utils/api')
      register.mockRejectedValueOnce(new Error('验证码错误'))

      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      const codeInput = screen.getByTestId('code-input')
      const agreeCheckbox = screen.getByTestId('agree-checkbox')
      const submitButton = screen.getByTestId('submit-button')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '000000')
      await userEvent.click(agreeCheckbox)
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('验证码错误')
      })
    })

    it('验证码过期显示错误信息', async () => {
      const { register } = await import('../../src/utils/api')
      register.mockRejectedValueOnce(new Error('验证码已过期'))

      renderRegister()
      const phoneInput = screen.getByTestId('phone-input')
      const codeInput = screen.getByTestId('code-input')
      const agreeCheckbox = screen.getByTestId('agree-checkbox')
      const submitButton = screen.getByTestId('submit-button')

      await userEvent.type(phoneInput, '13800138000')
      await userEvent.type(codeInput, '123456')
      await userEvent.click(agreeCheckbox)
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('验证码已过期')
      })
    })
  })
})