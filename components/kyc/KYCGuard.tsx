import React, { useEffect, useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useKYC } from '@/hooks/useKYC'
import { KYCModal } from './KYCModal'

interface KYCGuardProps {
  children: React.ReactNode
}

export function KYCGuard({ children }: KYCGuardProps) {
  const { account } = useWallet()
  const { isIndian, loading, needsKYC, canAccessPlatform, isRejected, updateKYCStatus } = useKYC()
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [hasCheckedKYC, setHasCheckedKYC] = useState(false)

  useEffect(() => {
    if (!account || loading) return

    // If user is connected and we haven't checked KYC yet
    if (!hasCheckedKYC) {
      setHasCheckedKYC(true)
      
      // If user needs KYC, show modal
      if (needsKYC()) {
        setShowKYCModal(true)
      }
    }
  }, [account, loading, needsKYC, hasCheckedKYC])

  // Show loading state while checking KYC
  if (account && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  // If user is not connected, show normal content
  if (!account) {
    return <>{children}</>
  }

  // If user can access platform, show content
  if (canAccessPlatform()) {
    return <>{children}</>
  }

  // If user is rejected, show rejection screen
  if (isRejected()) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md mx-auto text-center px-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Restricted
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              This platform is exclusively for Indian residents. Unfortunately, you have declined the KYC verification process and cannot access the platform.
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                    Indian Residents Only
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    To comply with Indian regulations, only verified Indian residents can access this platform.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowKYCModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Retry Verification
            </button>
          </div>
        </div>
        
        <KYCModal
          isOpen={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          onComplete={() => {
            updateKYCStatus(true) // Mark as Indian
            setShowKYCModal(false)
          }}
        />
      </>
    )
  }

  // Show KYC modal for pending users
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            KYC Verification Required
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            To access Orion, you need to complete a quick verification process to confirm your Indian residency.
          </p>
          
          <button
            onClick={() => setShowKYCModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Verification
          </button>
        </div>
      </div>
      
      <KYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onComplete={() => {
          updateKYCStatus(true) // Mark as Indian
          setShowKYCModal(false)
        }}
      />
    </>
  )
}
