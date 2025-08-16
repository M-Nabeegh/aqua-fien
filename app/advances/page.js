'use client'
import { useEffect, useState } from 'react'
import Table from '../../components/Table'
import Form from '../../components/Form'

export default function AdvancesPage() {
  const [advances, setAdvances] = useState([])

  useEffect(() => {
    fetch('/api/advances').then(r => r.json()).then(setAdvances)
  }, [])

  const addAdvance = async (data) => {
    try {
      console.log('Sending POST request to create advance:', data)
      
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Advance created successfully:', result)
      
      // Refresh the advances list from the database
      const updatedAdvances = await fetch('/api/advances').then(r => r.json())
      setAdvances(updatedAdvances)
      
      alert('Advance added successfully!')
    } catch (error) {
      console.error('Error creating advance:', error)
      alert('Failed to create advance: ' + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Advances</h1>
      <Form title="Add Advance (Employee)" fields={['employeeId','amount','date','description']} onSubmit={addAdvance} />
      <Table columns={['id','employeeId','amount','date','description']} data={advances} />
    </div>
  )
}
