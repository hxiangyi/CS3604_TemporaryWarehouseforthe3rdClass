import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register.jsx'

// mock useNavigate 以验证跳转
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('注册页交互', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    // @ts-ignore
    delete global.fetch
  })

  test('请求验证码时手机号格式无效', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/register' }] }>
        <Register />
      </MemoryRouter>
    )

    await userEvent.type(
      screen.getByPlaceholderText('请输入手机号'),
      '123'
    )
    await userEvent.click(screen.getByRole('button', { name: '获取验证码' }))
    expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument()
  })

  test('请求验证码成功后按钮倒计时', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: '验证码已发送', seconds: 60 })
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register' }] }>
        <Register />
      </MemoryRouter>
    )

    await userEvent.type(
      screen.getByPlaceholderText('请输入手机号'),
      '13800138000'
    )
    await userEvent.click(screen.getByRole('button', { name: '获取验证码' }))

    // 按钮应显示倒计时
    expect(screen.getByRole('button', { name: /59秒后重试/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /59秒后重试/ })).toBeDisabled()

    // 等待1秒，倒计时应减少
    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)
    vi.useRealTimers()
    expect(screen.getByRole('button', { name: /58秒后重试/ })).toBeInTheDocument()
  })

  test('未同意用户协议时注册按钮禁用', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/register' }] }>
        <Register />
      </MemoryRouter>
    )

    // 输入手机号和验证码，但不勾选协议
    await userEvent.type(
      screen.getByPlaceholderText('请输入手机号'),
      '13800138000'
    )
    await userEvent.type(
      screen.getByPlaceholderText('请输入验证码'),
      '123456'
    )

    // 注册按钮应禁用
    expect(screen.getByRole('button', { name: '注册' })).toBeDisabled()

    // 勾选协议后按钮可用
    await userEvent.click(screen.getByRole('checkbox', { name: /同意《淘贝用户协议》/ }))
    expect(screen.getByRole('button', { name: '注册' })).toBeEnabled()
  })

  test('使用错误的验证码注册', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: '验证码错误' })
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register' }] }>
        <Register />
      </MemoryRouter>
    )

    await userEvent.type(
      screen.getByPlaceholderText('请输入手机号'),
      '13800138000'
    )
    await userEvent.type(
      screen.getByPlaceholderText('请输入验证码'),
      '000000'
    )
    await userEvent.click(screen.getByRole('checkbox', { name: /同意《淘贝用户协议》/ }))
    await userEvent.click(screen.getByRole('button', { name: '注册' }))
    expect(screen.getByText('验证码错误')).toBeInTheDocument()
  })

  test('使用已注册手机号注册时直接登录', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: '该手机号已注册，将直接为您登录' })
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register' }] }>
        <Register />
      </MemoryRouter>
    )

    await userEvent.type(
      screen.getByPlaceholderText('请输入手机号'),
      '13800138000'
    )
    await userEvent.type(
      screen.getByPlaceholderText('请输入验证码'),
      '123456'
    )
    await userEvent.click(screen.getByRole('checkbox', { name: /同意《淘贝用户协议》/ }))
    await userEvent.click(screen.getByRole('button', { name: '注册' }))
    expect(screen.getByText('该手机号已注册，将直接为您登录')).toBeInTheDocument()
    // 跳转在800ms后触发
    vi.useFakeTimers()
    vi.advanceTimersByTime(800)
    vi.useRealTimers()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('注册成功后提示并跳转首页', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: '注册成功' })
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register' }] }>
        <Register />
      </MemoryRouter>
    )

    await userEvent.type(
      screen.getByPlaceholderText('请输入手机号'),
      '13800138000'
    )
    await userEvent.type(
      screen.getByPlaceholderText('请输入验证码'),
      '123456'
    )
    await userEvent.click(screen.getByRole('checkbox', { name: /同意《淘贝用户协议》/ }))
    await userEvent.click(screen.getByRole('button', { name: '注册' }))
    expect(screen.getByText('注册成功')).toBeInTheDocument()
    // 跳转在800ms后触发
    vi.useFakeTimers()
    vi.advanceTimersByTime(800)
    vi.useRealTimers()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})