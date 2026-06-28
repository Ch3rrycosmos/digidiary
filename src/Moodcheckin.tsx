import { useState, useEffect } from 'react'

const moods = ['😄', '🙂', '😐', '😔', '😡', '😰']

function MoodCheckin() {
  const [selectedMood, setSelectedMood] = useState('')

  const today = new Date().toDateString()  // e.g. "Sun Jun 14 2026"

  useEffect(() => {
    const saved = localStorage.getItem(`mood-${today}`)
    if (saved) setSelectedMood(saved)
  }, [])

  function handleSelect(mood: string) {
    setSelectedMood(mood)
    localStorage.setItem(`mood-${today}`, mood)
  }

  return (
    <div>
      <h2>🎭 Mood Check-in</h2>
      <p>How are you feeling today?</p>
      <div>
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => handleSelect(mood)}
            style={{
              fontSize: '2rem',
              margin: '4px',
              border: selectedMood === mood ? '2px solid blue' : '1px solid gray',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {mood}
          </button>
        ))}
      </div>
      {selectedMood && <p>You're feeling {selectedMood} today</p>}
    </div>
  )
}

export default MoodCheckin