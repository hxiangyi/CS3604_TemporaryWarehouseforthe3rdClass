import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// 模拟 fetch
global.fetch = vi.fn();

// 模拟 alert
global.alert = vi.fn();

// 模拟 localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};

// 模拟路由导航
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('登录页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('手机号格式无效时应显示错误提示', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // 输入无效手机号
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), {
      target: { value: '123' }
    });

    // 点击获取验证码
    fireEvent.click(screen.getByText('获取验证码'));

    // 应显示错误提示
    expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument();
  });

  test('成功获取验证码后应显示倒计时', async () => {
    // 模拟成功响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: '验证码已发送' })
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // 输入有效手机号
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), {
      target: { value: '13800138000' }
    });

    // 点击获取验证码
    fireEvent.click(screen.getByText('获取验证码'));

    // 应显示倒计时
    await waitFor(() => {
      expect(screen.getByText('60秒后重试')).toBeInTheDocument();
    });

    // 按钮应被禁用
    expect(screen.getByText('60秒后重试')).toBeDisabled();
  });

  test('未注册手机号登录应显示错误提示', async () => {
    // 模拟未注册错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: '该手机号未注册，请先完成注册' })
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // 输入手机号和验证码
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), {
      target: { value: '13800138000' }
    });
    fireEvent.change(screen.getByPlaceholderText('请输入验证码'), {
      target: { value: '123456' }
    });

    // 提交登录
    fireEvent.submit(screen.getByRole('button', { name: '登录' }));

    // 应显示未注册错误
    await waitFor(() => {
      expect(screen.getByText('该手机号未注册，请先完成注册')).toBeInTheDocument();
    });
  });

  test('登录成功应跳转到首页', async () => {
    // 模拟登录成功响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'fake-token' })
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // 输入手机号和验证码
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), {
      target: { value: '13800138000' }
    });
    fireEvent.change(screen.getByPlaceholderText('请输入验证码'), {
      target: { value: '123456' }
    });

    // 提交登录
    fireEvent.submit(screen.getByRole('button', { name: '登录' }));

    // 应保存 token
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'fake-token');
    });

    // 应显示成功提示
    expect(alert).toHaveBeenCalledWith('登录成功');

    // 应跳转到首页
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});