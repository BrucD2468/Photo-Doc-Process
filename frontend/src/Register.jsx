import React, { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    department: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          department: parseInt(formData.department)
        })
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => onSwitchToLogin(), 2000)
      } else {
        setError(data.detail || 'Registration failed')
      }
    } catch (error) {
      setError('Registration failed')
    }
  }

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {success ? (
        <p className="success">Registration successful! Redirecting to login...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required />
          <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <input type="number" name="department" placeholder="Department (1, 2, 3...)" value={formData.department} onChange={handleChange} required />
          {error && <p className="error">{error}</p>}
          <button type="submit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2"/>
              <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Register
          </button>
        </form>
      )}
      <p>Already have an account? <a onClick={onSwitchToLogin}>Login</a></p>
    </div>
  )
}

export default Register
