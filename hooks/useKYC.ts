import { useState, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'

export function useKYC() {
  const { account } = useWallet()
  const [isIndian, setIsIndian] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const walletAddress = account?.address
    ? typeof (account as any).address === "string"
      ? (account as any).address
      : (account as any).address?.toString?.() ?? ""
    : ""

  // Check KYC status from localStorage
  useEffect(() => {
    if (!walletAddress) {
      setIsIndian(null)
      setLoading(false)
      return
    }

    const kycKey = `kyc_${walletAddress}`
    const storedValue = localStorage.getItem(kycKey)
    
    if (storedValue === null) {
      // New user - not verified yet
      setIsIndian(false)
    } else {
      // Existing user - check their status
      setIsIndian(storedValue === 'true')
    }
    
    setLoading(false)
  }, [walletAddress])

  // Update KYC status
  const updateKYCStatus = (indianStatus: boolean) => {
    if (!walletAddress) return
    
    const kycKey = `kyc_${walletAddress}`
    localStorage.setItem(kycKey, indianStatus.toString())
    setIsIndian(indianStatus)
  }

  // Check if user can access platform
  const canAccessPlatform = () => {
    return isIndian === true
  }

  // Check if user needs KYC
  const needsKYC = () => {
    return isIndian === false
  }

  // Check if user is rejected (not Indian)
  const isRejected = () => {
    return isIndian === false
  }

  return {
    isIndian,
    loading,
    updateKYCStatus,
    canAccessPlatform,
    needsKYC,
    isRejected,
    walletAddress
  }
}
