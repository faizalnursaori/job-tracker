import { Suspense } from 'react'
import AuthErrorContent from '@/components/auth/auth-error-content'
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading error page...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
