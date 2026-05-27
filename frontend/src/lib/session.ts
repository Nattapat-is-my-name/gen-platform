import { useState, useEffect } from 'react'

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // Check if session ID exists in localStorage
    let id = localStorage.getItem('session_id')
    
    // If not, generate a new one
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('session_id', id)
    }
    
    setSessionId(id)
  }, [])

  return sessionId
}