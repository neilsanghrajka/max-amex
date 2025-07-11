import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { PaymentButton } from '@/components/payment-button'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        Hello <span>{data.claims.email}</span>
      </p>
      <LogoutButton />
      <PaymentButton />
    </div>
  )
}
