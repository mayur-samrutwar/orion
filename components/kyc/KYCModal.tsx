import React, { useState } from 'react'

interface KYCModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function KYCModal({ isOpen, onClose, onComplete }: KYCModalProps) {
  const [step, setStep] = useState<'intro' | 'verification' | 'complete'>('intro')
  const [loading, setLoading] = useState(false)

  const handleAcceptKYC = () => {
    setLoading(true)
    // Simulate processing
    setTimeout(() => {
      setStep('complete')
      setLoading(false)
    }, 1000)
  }

  const handleRejectKYC = () => {
    onClose()
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {step === 'intro' && 'KYC Verification Required'}
            {step === 'verification' && 'Indian Residency Verification'}
            {step === 'complete' && 'Verification Complete'}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Welcome to Orion
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  To comply with Indian regulations, we need to verify that you are an Indian resident. 
                  This is a one-time verification process.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Indian Residents Only
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This platform is exclusively for Indian residents. Non-Indian users will not be able to access the platform.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRejectKYC}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => setStep('verification')}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Start Verification
                </button>
              </div>
            </div>
          )}

          {step === 'verification' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Confirm Indian Residency
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Please confirm that you are an Indian resident and eligible to use this platform.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                      Self-Declaration
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      By proceeding, you declare that you are an Indian resident and understand that this platform is exclusively for Indian users.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('intro')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleAcceptKYC}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Confirm & Proceed'}
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Verification Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Welcome to Orion! You can now access all platform features.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                      Access Granted
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your Indian residency has been verified. You can now trade, provide liquidity, and access all platform features.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Continue to Platform
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
