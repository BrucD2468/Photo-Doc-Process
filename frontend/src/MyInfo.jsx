import React, { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL

function MyInfo({ user, API_URL }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/my-info?email=${user.email}`)
      const data = await response.json()
      setRecords(data.records)
    } catch (err) {
      console.error('Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }

  const deleteBarcode = async (barcode) => {
    if (window.confirm(`Are you sure you want to delete barcode ${barcode}? This is irreversible.`)) {
      try {
        const resp = await fetch(`${API_URL}/api/barcode/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode, email: user.email })
        });
        const result = await resp.json();
        if (resp.ok) {
          fetchRecords();
        } else {
          alert(result.detail || 'Failed to delete barcode');
        }
      } catch (err) {
        alert('An error occurred while deleting the barcode.');
      }
    }
  };
}

export default MyInfo
