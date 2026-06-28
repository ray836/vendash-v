"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Bell,
  Mail,
  Globe,
  Save,
  Building2,
  Plug,
  Copy,
  Check,
} from "lucide-react"
import { getOrganization, updateOrganization, updateNotificationEmail, sendTestEmail, getIntegrationSettings, getIntegrationLogs } from "./actions"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "./theme-toggle"
export function Settings() {

  const [orgForm, setOrgForm] = useState({ name: '', address: '' })
  const [orgLoaded, setOrgLoaded] = useState(false)
  const [orgError, setOrgError] = useState<string | null>(null)
  const [orgSuccess, setOrgSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [notifEmail, setNotifEmail] = useState('')
  const [notifEmailSaving, setNotifEmailSaving] = useState(false)
  const [notifEmailSaved, setNotifEmailSaved] = useState(false)
  const [notifEmailError, setNotifEmailError] = useState<string | null>(null)
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null)

  type IntegrationLog = { id: string; status: string; message: string | null; createdAt: Date; source: string; cardReaderId: string | null }
  const [integrationSettings, setIntegrationSettings] = useState<{ endpointUrl: string; apiKey: string; logs: IntegrationLog[]; isLocalhost: boolean } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    getOrganization().then((org) => {
      if (org) {
        setOrgForm({ name: org.name, address: org.address ?? '' })
        setNotifEmail(org.notificationEmail ?? '')
      }
      setOrgLoaded(true)
    })
    getIntegrationSettings().then((s) => {
      if (s) setIntegrationSettings(s)
    })
  }, [])

  useEffect(() => {
    const id = setInterval(async () => {
      const logs = await getIntegrationLogs()
      if (logs) setIntegrationSettings(prev => prev ? { ...prev, logs } : prev)
    }, 20_000)
    return () => clearInterval(id)
  }, [])

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  function handleOrgSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setOrgError(null)
    setOrgSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateOrganization(fd)
        setOrgSuccess(true)
      } catch (err) {
        setOrgError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Order Notification Email</CardTitle>
              <CardDescription>
                VendorPro will email this address when your inventory is running low and an order should be placed. Emails are sent at most once every 3 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notif-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Notification Email
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="notif-email"
                    type="email"
                    placeholder="you@example.com"
                    value={notifEmail}
                    onChange={(e) => {
                      setNotifEmail(e.target.value)
                      setNotifEmailSaved(false)
                    }}
                    className="max-w-sm"
                  />
                  <Button
                    disabled={notifEmailSaving}
                    onClick={async () => {
                      setNotifEmailSaving(true)
                      setNotifEmailError(null)
                      setNotifEmailSaved(false)
                      try {
                        await updateNotificationEmail(notifEmail)
                        setNotifEmailSaved(true)
                      } catch (err) {
                        setNotifEmailError(err instanceof Error ? err.message : 'Failed to save')
                      } finally {
                        setNotifEmailSaving(false)
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {notifEmailSaving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
                {notifEmailSaved && <p className="text-sm text-green-600">Saved.</p>}
                {notifEmailError && <p className="text-sm text-destructive">{notifEmailError}</p>}
                <p className="text-xs text-muted-foreground">
                  Leave blank to disable order notifications.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Send a Test Email</Label>
                <p className="text-sm text-muted-foreground">
                  Sends a test message to the saved notification email to confirm delivery is working.
                </p>
                <Button
                  variant="outline"
                  disabled={testEmailSending || !notifEmail}
                  onClick={async () => {
                    setTestEmailSending(true)
                    setTestEmailResult(null)
                    try {
                      const result = await sendTestEmail()
                      setTestEmailResult(
                        result.success
                          ? { success: true, message: `Test email sent to ${notifEmail}` }
                          : { success: false, message: result.error ?? 'Failed to send' }
                      )
                    } catch (err) {
                      setTestEmailResult({ success: false, message: err instanceof Error ? err.message : 'Failed to send' })
                    } finally {
                      setTestEmailSending(false)
                    }
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {testEmailSending ? 'Sending…' : 'Send Test Email'}
                </Button>
                {testEmailResult && (
                  <p className={`text-sm ${testEmailResult.success ? 'text-green-600' : 'text-destructive'}`}>
                    {testEmailResult.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Choose how the app looks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeToggle />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your organization&apos;s name and address.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleOrgSubmit}>
              <CardContent className="space-y-4">
                {!orgLoaded ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Company Name</Label>
                      <Input
                        id="org-name"
                        name="name"
                        required
                        value={orgForm.name}
                        onChange={(e) =>
                          setOrgForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-address">Business Address</Label>
                      <Input
                        id="org-address"
                        name="address"
                        placeholder="123 Main St, City, State"
                        value={orgForm.address}
                        onChange={(e) =>
                          setOrgForm((prev) => ({ ...prev, address: e.target.value }))
                        }
                      />
                    </div>
                    {orgError && (
                      <p className="text-sm text-destructive">{orgError}</p>
                    )}
                    {orgSuccess && (
                      <p className="text-sm text-green-600">Changes saved.</p>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="ml-auto" disabled={isPending || !orgLoaded}>
                  <Save className="mr-2 h-4 w-4" />
                  {isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        {/* Integrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Device Integrations</CardTitle>
              <CardDescription>
                Connect your Cantaloupe ePort card readers to automatically sync transaction data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* Localhost warning */}
              {integrationSettings?.isLocalhost && (
                <div className="flex gap-3 p-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 text-sm">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">⚠ Local development detected</span>
                  <span className="text-amber-700 dark:text-amber-300">The endpoint URL uses localhost and is not reachable by SeedLive. Deploy to Vercel and set <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900 px-1 rounded">NEXT_PUBLIC_APP_URL</code> to your production URL.</span>
                </div>
              )}

              {/* Integration status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Connection Status</h3>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </div>
                {!integrationSettings ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : integrationSettings.logs.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/40">
                    <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">No transactions received yet</p>
                      <p className="text-xs text-muted-foreground">Once SeedLive is configured and sends its first transaction, the status will appear here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {integrationSettings.logs.map((log) => (
                      <div key={log.id} className={`flex items-start gap-3 p-3 rounded-md border text-sm ${log.status === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}`}>
                        <div className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${log.status === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                {log.status === 'success' ? 'Test Transport successful' : 'Test Transport failed'}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">SeedLive</span>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {log.message && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">{log.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Connection credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Connection Details</h3>
                <p className="text-sm text-muted-foreground">
                  Use these values when configuring the HTTP POST transport in SeedLive.
                </p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Endpoint URL</label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={integrationSettings?.endpointUrl ?? 'Loading…'}
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!integrationSettings}
                        onClick={() => integrationSettings && copyToClipboard(integrationSettings.endpointUrl, 'url')}
                      >
                        {copiedField === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">The API key is embedded in the URL. Leave Username and Password blank in SeedLive.</p>
                </div>
              </div>

              <Separator />

              {/* Step-by-step guide */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Cantaloupe ePort Setup Guide</h3>
                <p className="text-sm text-muted-foreground">
                  Follow these steps to connect your ePort devices to VendorPro via the SeedLive portal.
                </p>

                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                  <div className="space-y-1 pt-1">
                    <p className="font-medium">Map each ePort device to a machine</p>
                    <p className="text-sm text-muted-foreground">
                      In VendorPro, go to <span className="font-medium text-foreground">Machines → Edit Machine</span> and enter the ePort device serial number in the <span className="font-medium text-foreground">Card Reader ID</span> field. This links transactions from that reader to the correct machine.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                  <div className="space-y-1 pt-1">
                    <p className="font-medium">Open SeedLive and go to Report Register</p>
                    <p className="text-sm text-muted-foreground">
                      Log in at <a href="https://www.seedlive.com" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">seedlive.com</a>, then navigate to <span className="font-medium text-foreground">Reports → Report Register</span> and click <span className="font-medium text-foreground">Add Transport</span>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                  <div className="space-y-1 pt-1">
                    <p className="font-medium">Configure the HTTP POST transport</p>
                    <p className="text-sm text-muted-foreground mb-2">Fill in the following fields:</p>
                    <div className="rounded-md border divide-y text-sm">
                      {[
                        { label: "Transport Name", value: "VendorPro" },
                        { label: "Transport Type", value: "HTTP POST" },
                        { label: "URL", value: integrationSettings?.endpointUrl ?? null },
                        { label: "Username", value: null, placeholder: "leave blank" },
                        { label: "Password", value: null, placeholder: "leave blank" },
                      ].map(({ label, value, placeholder }) => (
                        <div key={label} className="grid grid-cols-2 items-center px-3 py-2">
                          <span className="text-muted-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            {value ? (
                              <>
                                <span className="font-mono text-xs break-all flex-1">{value}</span>
                                <button
                                  onClick={() => copyToClipboard(value, `step3-${label}`)}
                                  className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title={`Copy ${label}`}
                                >
                                  {copiedField === `step3-${label}` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </>
                            ) : (
                              <span className={placeholder ? "text-muted-foreground italic" : "font-medium"}>{placeholder ?? value}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                  <div className="space-y-1 pt-1">
                    <p className="font-medium">Test the transport</p>
                    <p className="text-sm text-muted-foreground">
                      Click <span className="font-medium text-foreground">Test Transport</span>. You should see a success response. Then click <span className="font-medium text-foreground">Add Transport</span> to save it.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">5</div>
                  <div className="space-y-1 pt-1">
                    <p className="font-medium">Create the transaction reports</p>
                    <p className="text-sm text-muted-foreground">
                      In the same Report Register screen, click <span className="font-medium text-foreground">Create</span> and configure three reports — each using the VendorPro transport you just created:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      <li><span className="font-medium text-foreground">Single Transaction Data Export (CSV)</span></li>
                      <li><span className="font-medium text-foreground">DEX File</span></li>
                      <li><span className="font-medium text-foreground">Transaction Line Item Data Export</span></li>
                    </ul>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">6</div>
                  <div className="space-y-1 pt-1">
                    <p className="font-medium">Verify data is flowing</p>
                    <p className="text-sm text-muted-foreground">
                      Make a test purchase on any connected machine. Within a few minutes, the transaction should appear on the <span className="font-medium text-foreground">Sales</span> page in VendorPro.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
