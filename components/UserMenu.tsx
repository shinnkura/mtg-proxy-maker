'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'
import { User, LogOut, Settings, Save, History } from 'lucide-react'

interface UserMenuProps {
  onLoginClick: () => void
}

export default function UserMenu({ onLoginClick }: UserMenuProps) {
  const { user, signOut, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowDropdown(false)
  }

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    )
  }

  if (!user) {
    return (
      <Button
        onClick={onLoginClick}
        size="sm"
        variant="outline"
        className="border-blue-600 text-blue-600 hover:bg-blue-50"
      >
        <User className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">ログイン</span>
      </Button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-32 truncate">
          {user.email}
        </span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">ログイン中</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => {
                setShowDropdown(false)
                // TODO: データ保存機能を実装
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              データを保存
            </button>
            
            <button
              onClick={() => {
                setShowDropdown(false)
                // TODO: 履歴表示機能を実装
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              保存履歴
            </button>
            
            <button
              onClick={() => {
                setShowDropdown(false)
                // TODO: 設定画面を実装
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              設定
            </button>
          </div>
          
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  )
}