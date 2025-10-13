# 接口清单

服务地址：`http://localhost:3000`

## 1. 请求验证码
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
  "success": true,
  "message": "验证码已生成"
}
```
- 失败响应示例：
```json
{ "message": "请输入正确的手机号码" }
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
{
  "success": true,
  "message": "登录成功",
  "token": "<jwt-token>"
}
```
- 失败响应示例：
```json
{ "message": "该手机号未注册，请先完成注册" }
```
```json
{ "message": "验证码错误" }
```
```json
{ "message": "请输入正确的手机号码" }
```

更多细节请参见 `artifacts/openapi.json`，或直接导入 `artifacts/postman_collection.json` 进行调用。