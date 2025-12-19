import { useState } from 'react'
import './IndexCard.css'

interface IndexCardProps {
  title: string;  // Immutable prop from parent
}

function IndexCard({ title }: IndexCardProps) {
  // Dynamic state - can be changed by this component
  const [content, setContent] = useState('')

  return (
    <div className="index-card">
      <h3 className="index-card-title">{title}</h3>
      
      <textarea
        className="index-card-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your content here..."
        rows={4}
      />
      
      {content && (
        <div className="index-card-preview">
          <strong>Preview:</strong>
          <p className="index-card-content">{content}</p>
        </div>
      )}
    </div>
  )
}

export default IndexCard

