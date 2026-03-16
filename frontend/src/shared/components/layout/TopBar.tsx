import { UserButton } from '@clerk/react'

export default function TopBar() {
  return (
    <header className="flex h-14 items-center justify-end border-b bg-white px-6">
      <UserButton />
    </header>
  )
}
