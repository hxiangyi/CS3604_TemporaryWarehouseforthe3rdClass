# 接口清单

服务地址：`http://localhost:3000`

说明：
- 所有错误响应均使用字段 `error` 表示错误信息。
- 验证码为6位数字，生成后会打印到后端控制台，有效期为60秒。

## 1. 请求验证码（登录/注册通用）
- 路径：`POST /auth/request-code`
- 请求体：
```json
{
  "phone": "13800138000"
}
```
- 成功响应：
```json
{
  "message": "验证码已发送",
  "seconds": 60
}
```
- 失败响应示例：
```json
{ "error": "请输入正确的手机号码" }
```

## 2. 登录
- 路径：`POST /auth/login`
- 请求体：
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```
- 成功响应：
```json
{ "message": "登录成功" }
```
- 失败响应示例：
```json
{ "error": "该手机号未注册，请先完成注册" }
```
```json
{ "error": "验证码错误" }
```
```json
{ "error": "验证码已过期" }
```
```json
{ "error": "请输入正确的手机号码" }
```

## 3. 注册
- 路径：`POST /auth/register`
- 请求体：
```json
{
  "phone": "13800138000",
  "code": "123456",
  "agree": true
}
```
- 成功响应：
```json
{ "message": "注册成功" }
```
或（已注册用户再次注册时）
```json
{ "message": "该手机号已注册，将直接为您登录" }
```
- 失败响应示例：
```json
{ "error": "请输入正确的手机号码" }
```
```json
{ "error": "请先同意《淘贝用户协议》" }
```
```json
{ "error": "验证码错误" }
```
```json
{ "error": "验证码已过期" }
```

更多细节请参见 `artifacts/openapi.json`，或直接导入 `artifacts/postman_collection.json` 进行调用与测试。