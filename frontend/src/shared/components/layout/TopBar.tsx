import { UserButton } from '@clerk/react'

export default function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <p className="text-sm text-gray-500">
        Construction CO₂ footprint calculator
      </p>
      <UserButton />
    </header>
  )
}
