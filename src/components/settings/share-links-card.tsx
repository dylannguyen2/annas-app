'use client'

import { useState } from 'react'
import { useShareLinks } from '@/hooks/use-share-links'
import { navGroups } from '@/components/layout/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Link2, Copy, Trash2, Plus, Check, Loader2, Clock, Eye, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function ShareLinksCard() {
  const { shareLinks, loading, createShareLink, deleteShareLink, getShareUrl } = useShareLinks()
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [formData, setFormData] = useState<{
    name: string
    allowed_pages: string[]
    expires_at: string
  }>({
    name: '',
    allowed_pages: [],
    expires_at: ''
  })

  const getPageName = (href: string) => {
    for (const group of navGroups) {
      const item = group.items.find(i => i.href === href)
      if (item) return item.name
    }
    return href
  }

  const handleCopy = async (id: string, token: string) => {
    const url = getShareUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Share link copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteShareLink(id)
      toast.success('Share link deleted')
    } catch (error) {
      toast.error('Failed to delete share link')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Please enter a name for the share link')
      return
    }
    if (formData.allowed_pages.length === 0) {
      toast.error('Please select at least one page to share')
      return
    }

    setCreating(true)
    try {
      await createShareLink({
        name: formData.name,
        allowed_pages: formData.allowed_pages,
        expires_at: formData.expires_at || null
      })
      toast.success('Share link created')
      setShowForm(false)
      setFormData({ name: '', allowed_pages: [], expires_at: '' })
    } catch (error) {
      toast.error('Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const togglePage = (href: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_pages: prev.allowed_pages.includes(href)
        ? prev.allowed_pages.filter(p => p !== href)
        : [...prev.allowed_pages, href]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Share Links</CardTitle>
            <CardDescription>
              Create temporary links to share specific pages of your dashboard
            </CardDescription>
          </div>
          {!showForm && !loading && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Link
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading share links...
          </div>
        ) : showForm ? (
          <form onSubmit={handleCreate} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Link Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. For Doctor, Family Sharing"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed Pages</Label>
                <div className="grid gap-4 sm:grid-cols-2 border rounded-lg p-4 bg-muted/30">
                  {navGroups.map(group => (
                    <div key={group.label} className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        {group.label}
                      </h4>
                      <div className="space-y-2">
                        {group.items.map(item => (
                          <div key={item.href} className="flex items-center space-x-2">
                            <Checkbox
                              id={`page-${item.href}`}
                              checked={formData.allowed_pages.includes(item.href)}
                              onCheckedChange={() => togglePage(item.href)}
                            />
                            <Label
                              htmlFor={`page-${item.href}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expires At (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={e => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for no expiration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Create Link
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : shareLinks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Link2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">No share links yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Create a link to share specific parts of your dashboard with others.
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create your first link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {shareLinks.map(link => (
              <div
                key={link.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="space-y-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{link.name}</h3>
                    {link.expires_at && new Date(link.expires_at) < new Date() && (
                      <Badge variant="destructive" className="text-[10px] h-5">Expired</Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {link.allowed_pages.map(page => (
                      <Badge key={page} variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                        {getPageName(page)}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Views">
                      <Eye className="h-3 w-3" />
                      <span>{link.access_count} views</span>
                    </div>
                    {link.last_accessed_at && (
                      <div className="flex items-center gap-1" title="Last accessed">
                        <Clock className="h-3 w-3" />
                        <span>Last: {format(new Date(link.last_accessed_at), 'MMM d, h:mm a')}</span>
                      </div>
                    )}
                    {link.expires_at && (
                      <div className="flex items-center gap-1" title="Expires">
                        <Calendar className="h-3 w-3" />
                        <span>Exp: {format(new Date(link.expires_at), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-start pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 lg:px-3"
                    onClick={() => handleCopy(link.id, link.token)}
                  >
                    {copiedId === link.id ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    <span className="sr-only lg:not-sr-only">
                      {copiedId === link.id ? 'Copied' : 'Copy URL'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(link.id)}
                    disabled={deletingId === link.id}
                  >
                    {deletingId === link.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
