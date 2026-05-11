'use client'

import { useRouter } from 'next/navigation'

export function GuestBrowseLink() {
  const router = useRouter()

  function handleClick() {
    localStorage.setItem('imagine_tutorial_pending', '1')
    router.push('/explore')
  }

  return (
    <button
      onClick={handleClick}
      className="font-medium text-stone-500 underline underline-offset-2 hover:text-stone-800 transition-colors"
    >
      browse without an account
    </button>
  )
}
