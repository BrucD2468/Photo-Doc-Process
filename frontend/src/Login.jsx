import React, { useState } from 'react'
import './Login.css'
import logo from './images/logo.png' // Assuming logo is in src/images

const API_URL = import.meta.env.VITE_API_URL || ""

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (data.success) {
        onLogin(data.user)
      } else {
        setError('Invalid credentials')
      }
    } catch (error) {
      setError('Login failed')
    }
  }

  return (
    <div className="login-page-container">
      <div className="login-brand-section">
        <h1>Welcome to Barcode App</h1>
        <p>Scan, Track, and Manage with Ease.</p>
        {/* Placeholder for an illustration or graphic */}
        <div className="brand-graphic-placeholder"></div> 
      </div>
      <div className="login-form-section">
        <div className="login-card">
          <img src={logo} alt="Logo" className="login-logo" />
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <label htmlFor="email">Email</label>
            </div>
            <div className="input-group">
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <label htmlFor="password">Password</label>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="login-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Login
            </button>
          </form>
          <p>Don't have an account? <a onClick={onSwitchToRegister}>Register</a></p>
        </div>
      </div>
    </div>
  )
}

export default Login
