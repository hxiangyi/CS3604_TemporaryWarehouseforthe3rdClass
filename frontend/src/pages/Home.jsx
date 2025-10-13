import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 24 }}>
      <h2>首页</h2>
      <button
        style={{ padding: '8px 16px', fontSize: 16 }}
        onClick={() => navigate('/login')}
      >
        亲，请登录
      </button>
    </div>
  )
}