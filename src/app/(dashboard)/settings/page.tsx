'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useHealth } from '@/hooks/use-health'
import { Loader2, Check, X, RefreshCw, FileJson, FileText, CreditCard, Eye, EyeOff, Share2, Copy, Trash2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useFeatureVisibility } from '@/hooks/use-feature-visibility'
import { navGroups } from '@/components/layout/sidebar'
import ShareLinksCard from '@/components/settings/share-links-card'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

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
  const [openingPortal, setOpeningPortal] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoCopied, setDemoCopied] = useState(false)

  const { hiddenFeatures, toggleFeature, isFeatureVisible } = useFeatureVisibility()

  const { data: demoSession, mutate: mutateDemoSession } = useSWR<{
    active: boolean
    token?: string
    url?: string
    expires_at?: string
    started_at?: string
  }>('/api/demo', fetcher)

  const { data: subscription } = useSWR<{
    status: string
    current_period_end: string
    trial_end: string | null
    cancel_at_period_end: boolean
  }>('/api/subscription', fetcher)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleManageBilling = async () => {
    setOpeningPortal(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
    } finally {
      setOpeningPortal(false)
    }
  }

  const handleStartDemo = async () => {
    setDemoLoading(true)
    try {
      const response = await fetch('/api/demo', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        mutateDemoSession({ active: true, ...data })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start demo')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleEndDemo = async () => {
    setDemoLoading(true)
    try {
      await fetch('/api/demo', { method: 'DELETE' })
      mutateDemoSession({ active: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end demo')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleCopyDemoLink = async () => {
    if (demoSession?.url) {
      await navigator.clipboard.writeText(demoSession.url)
      setDemoCopied(true)
      setTimeout(() => setDemoCopied(false), 2000)
    }
  }

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
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.status === 'trialing' ? (
                      <>Trial ends {new Date(subscription.trial_end || subscription.current_period_end).toLocaleDateString()}</>
                    ) : subscription.cancel_at_period_end ? (
                      <>Cancels {new Date(subscription.current_period_end).toLocaleDateString()}</>
                    ) : (
                      <>Renews {new Date(subscription.current_period_end).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {subscription.status === 'trialing' ? 'Trial' : 
                   subscription.status === 'active' ? 'Active' : 
                   subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleManageBilling}
                disabled={openingPortal}
              >
                {openingPortal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading subscription...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {demoSession !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Demo Mode</CardTitle>
            <CardDescription>
              Share a temporary demo link with friends or colleagues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoSession?.active ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Share2 className="h-5 w-5" />
                  <span className="font-medium">Demo session active</span>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Share this link:</p>
                  <code className="text-sm break-all">{demoSession.url}</code>
                </div>

                <p className="text-sm text-muted-foreground">
                  Expires: {demoSession.expires_at && new Date(demoSession.expires_at).toLocaleString()}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyDemoLink}
                    disabled={demoLoading}
                  >
                    {demoCopied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {demoCopied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleEndDemo}
                    disabled={demoLoading}
                  >
                    {demoLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    End Demo
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Ending the demo will delete all data created during this session.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start a demo session to generate a shareable link. Anyone with the link can view your app for 24 hours. When you end the session, all data created during the demo will be deleted.
                </p>
                <Button
                  onClick={handleStartDemo}
                  disabled={demoLoading}
                >
                  {demoLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="mr-2 h-4 w-4" />
                  )}
                  Start Demo Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ShareLinksCard />

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
          <CardTitle>Feature Visibility</CardTitle>
          <CardDescription>
            Choose which features to show in the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isVisible = isFeatureVisible(item.href)
                  return (
                    <div key={item.href} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeature(item.href)}
                        className="h-8 w-8 p-0"
                      >
                        {isVisible ? (
                          <Eye className="h-4 w-4 text-primary" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Hidden features are removed from the sidebar but can still be accessed via URL.
          </p>
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
