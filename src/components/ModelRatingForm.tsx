'use client'

import { useState } from 'react'
import { Star, Send, X } from 'lucide-react'

interface RatingData {
  modelId: string
  rating: number
  speedRating?: number
  qualityRating?: number
  costRating?: number
  comment?: string
  taskType?: string
}

interface ModelRatingFormProps {
  modelId: string
  modelName: string
  onClose: () => void
  onSubmit: (rating: RatingData) => void
}

export function ModelRatingForm({ modelId, modelName, onClose, onSubmit }: ModelRatingFormProps) {
  const [rating, setRating] = useState(0)
  const [speedRating, setSpeedRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [costRating, setCostRating] = useState(0)
  const [comment, setComment] = useState('')
  const [taskType, setTaskType] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      alert('Please provide an overall rating')
      return
    }

    try {
      setSubmitting(true)

      const ratingData = {
        modelId,
        rating,
        speedRating: speedRating || undefined,
        qualityRating: qualityRating || undefined,
        costRating: costRating || undefined,
        comment: comment.trim() || undefined,
        taskType: taskType || undefined
      }

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ratingData)
      })

      if (response.ok) {
        onSubmit(ratingData)
        onClose()
      } else {
        throw new Error('Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ value, onChange, label }: { value: number, onChange: (value: number) => void, label: string }) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">{label}:</span>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              } hover:text-yellow-400`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{value}/5</span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rate {modelName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <StarRating
            value={rating}
            onChange={setRating}
            label="Overall"
          />

          <StarRating
            value={speedRating}
            onChange={setSpeedRating}
            label="Speed"
          />

          <StarRating
            value={qualityRating}
            onChange={setQualityRating}
            label="Quality"
          />

          <StarRating
            value={costRating}
            onChange={setCostRating}
            label="Value"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Type
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="">Select task type (optional)</option>
              <option value="coding">Coding</option>
              <option value="chat">Chat/Conversation</option>
              <option value="analysis">Data Analysis</option>
              <option value="writing">Writing</option>
              <option value="debugging">Debugging</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this model..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
