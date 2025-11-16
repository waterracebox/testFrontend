import React, { useEffect, useRef, useState } from 'react'

export default function App(){
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const wsRef = useRef(null)

  useEffect(()=>{
    // 從 Vite 環境變數讀取後端 WebSocket 位址（build 時注入）
    // 預設 fallback 為本機的 ws://localhost:3000
    const envWs = import.meta.env.VITE_BACKEND_WS;
    const envHost = import.meta.env.VITE_BACKEND_HOST; // 可選：host:port
    const defaultHost = 'localhost:3000';
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = envWs || (proto + (envHost || defaultHost));

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws

    ws.addEventListener('open', ()=>{
      ws.send(JSON.stringify({ type: 'get_messages' }))
    })

    ws.addEventListener('message', (e)=>{
      try{
        const d = JSON.parse(e.data)
        if(d.type === 'messages'){
          setMessages(d.messages)
        } else if(d.type === 'broadcast'){
          setMessages(prev => [...prev, d.message])
        } else if(d.type === 'service_notice'){
          setMessages(prev => [...prev, { id: `notice-${Date.now()}`, text: d.message, created_at: new Date().toISOString() }])
        }
      }catch(err){
        console.error('msg parse', err)
      }
    })

    ws.addEventListener('close', ()=> console.log('ws closed'))

    return ()=> ws.close()
  }, [])

  function send(){
    if(!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'new_message', text }))
    setText('')
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h3>即時通知 (前端)</h3>
      <div style={{ marginBottom: 12 }}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="輸入訊息" style={{ width: '60%' }} />
        <button onClick={send} style={{ marginLeft: 8 }}>送出</button>
      </div>
      <ul>
        {messages.map((m, idx)=> (
          <li key={m.id ?? idx}><strong>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</strong> - {m.text}</li>
        ))}
      </ul>
    </div>
  )
}
