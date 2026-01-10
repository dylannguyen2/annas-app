'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useHealth } from '@/hooks/use-health'
import { Loader2, Check, X, RefreshCw, FileJson, FileText } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ThemeSwitcher } from '@/components/theme-switcher'

export default function SettingsPage() {
  const { garminStatus, connectGarmin, disconnectGarmin, syncing, syncGarmin } = useHealth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setError(null)
    
    try {
      await connectGarmin(email, password)
      setEmail('')
      setPassword('')
      await syncGarmin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await disconnectGarmin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSync = async () => {
    try {
      await syncGarmin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true)
    try {
      const response = await fetch(`/api/export?format=${format}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `annas-app-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Garmin Connection</CardTitle>
          <CardDescription>
            Connect your Garmin account to sync health data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {garminStatus.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">Connected to Garmin</span>
              </div>
              
              {garminStatus.lastSync && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {new Date(garminStatus.lastSync).toLocaleString()}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="garmin-email">Garmin Email</Label>
                <Input
                  id="garmin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="garmin-password">Garmin Password</Label>
                <Input
                  id="garmin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              <Button type="submit" disabled={connecting}>
                {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {connecting ? 'Connecting...' : 'Connect Garmin'}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Your Garmin credentials are encrypted and stored securely.
                We use them only to sync your health data.
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" placeholder="Australia/Sydney" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme</p>
            </div>
            {mounted && (
              <Switch 
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            )}
          </div>
          <Separator />
          <div>
            <p className="font-medium mb-2">Color Theme</p>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred color palette</p>
            {mounted && <ThemeSwitcher />}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded to log your mood</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>
            Export all your data for backup or analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('json')}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="mr-2 h-4 w-4" />
              )}
              Export JSON
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Exports include habits, mood logs, workouts, and health data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
