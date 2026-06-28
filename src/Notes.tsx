import { useState, useEffect } from 'react'

function Notes() {
  const [didToday, setDidToday] = useState('')
  const [planTomorrow, setPlanTomorrow] = useState('')

  // Load saved notes when component first mounts
  useEffect(() => {
    const savedDid = localStorage.getItem('didToday')
    const savedPlan = localStorage.getItem('planTomorrow')
    if (savedDid) setDidToday(savedDid)
    if (savedPlan) setPlanTomorrow(savedPlan)
  }, [])

  // Save "didToday" whenever it changes
  useEffect(() => {
    localStorage.setItem('didToday', didToday)
  }, [didToday])

  // Save "planTomorrow" whenever it changes
  useEffect(() => {
    localStorage.setItem('planTomorrow', planTomorrow)
  }, [planTomorrow])

  return (
    <div>
      <h2>📓 Daily Notes</h2>

      <h3>What I did today</h3>
      <textarea
        value={didToday}
        onChange={(e) => setDidToday(e.target.value)}
        placeholder="Write about your day..."
        rows={4}
        style={{ width: '100%' }}
      />

      <h3>What I want to do tomorrow</h3>
      <textarea
        value={planTomorrow}
        onChange={(e) => setPlanTomorrow(e.target.value)}
        placeholder="Plan for tomorrow..."
        rows={4}
        style={{ width: '100%' }}
      />
    </div>
  )
}

export default Notes