"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import {
  User,
  Bell,
  Mail,
  Shield,
  Package,
  Smartphone,
  Globe,
  Save,
  Trash2,
} from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ThemeToggle } from "./theme-toggle"
export function Settings() {
  const [accountForm, setAccountForm] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Administrator",
    bio: "Managing vending machines across the campus.",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    criticalAlerts: true,
    weeklyReports: true,
    machineStatus: true,
    inventoryAlerts: true,
    salesReports: false,
  })

  const [displaySettings, setDisplaySettings] = useState({
    theme: "light",
    density: "comfortable",
    defaultView: "grid",
    language: "en",
    timezone: "America/New_York",
  })

  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: "10",
    criticalStockThreshold: "5",
    autoReorder: true,
    reorderLeadTime: "7",
    defaultSupplier: "Sam's Club",
  })

  const handleAccountFormChange = (field: string, value: string) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = (field: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }))
  }

  const handleDisplayChange = (field: string, value: string) => {
    setDisplaySettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleInventoryChange = (field: string, value: string | boolean) => {
    setInventorySettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
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
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg" alt="Profile" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={accountForm.name}
                        onChange={(e) =>
                          handleAccountFormChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={accountForm.email}
                        onChange={(e) =>
                          handleAccountFormChange("email", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={accountForm.role}
                      onValueChange={(value) =>
                        handleAccountFormChange("role", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrator">
                          Administrator
                        </SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Technician">Technician</SelectItem>
                        <SelectItem value="Inventory Specialist">
                          Inventory Specialist
                        </SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a little about yourself"
                      className="min-h-[100px]"
                      value={accountForm.bio}
                      onChange={(e) =>
                        handleAccountFormChange("bio", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Main St" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="New York" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">Zip Code</Label>
                    <Input id="zipcode" placeholder="10001" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="email-notifications" className="flex-1">
                        Email Notifications
                      </Label>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.email}
                      onCheckedChange={() => handleNotificationToggle("email")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="push-notifications" className="flex-1">
                        Push Notifications
                      </Label>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.push}
                      onCheckedChange={() => handleNotificationToggle("push")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="sms-notifications" className="flex-1">
                        SMS Notifications
                      </Label>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.sms}
                      onCheckedChange={() => handleNotificationToggle("sms")}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="critical-alerts" className="font-medium">
                        Critical Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts for critical inventory levels and machine
                        issues.
                      </p>
                    </div>
                    <Switch
                      id="critical-alerts"
                      checked={notificationSettings.criticalAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle("criticalAlerts")
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-reports" className="font-medium">
                        Weekly Reports
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly summary reports of sales and inventory.
                      </p>
                    </div>
                    <Switch
                      id="weekly-reports"
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={() =>
                        handleNotificationToggle("weeklyReports")
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="machine-status" className="font-medium">
                        Machine Status Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when machine status changes
                        (online/offline).
                      </p>
                    </div>
                    <Switch
                      id="machine-status"
                      checked={notificationSettings.machineStatus}
                      onCheckedChange={() =>
                        handleNotificationToggle("machineStatus")
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="inventory-alerts" className="font-medium">
                        Inventory Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when products reach low stock thresholds.
                      </p>
                    </div>
                    <Switch
                      id="inventory-alerts"
                      checked={notificationSettings.inventoryAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle("inventoryAlerts")
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sales-reports" className="font-medium">
                        Sales Reports
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily sales reports and analytics.
                      </p>
                    </div>
                    <Switch
                      id="sales-reports"
                      checked={notificationSettings.salesReports}
                      onCheckedChange={() =>
                        handleNotificationToggle("salesReports")
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize the appearance and behavior of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeToggle />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <RadioGroup
                    defaultValue={displaySettings.theme}
                    onValueChange={(value) =>
                      handleDisplayChange("theme", value)
                    }
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="theme-light" />
                      <Label htmlFor="theme-light">Light</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="theme-dark" />
                      <Label htmlFor="theme-dark">Dark</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="theme-system" />
                      <Label htmlFor="theme-system">System</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Density</Label>
                  <RadioGroup
                    defaultValue={displaySettings.density}
                    onValueChange={(value) =>
                      handleDisplayChange("density", value)
                    }
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="compact" id="density-compact" />
                      <Label htmlFor="density-compact">Compact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="comfortable"
                        id="density-comfortable"
                      />
                      <Label htmlFor="density-comfortable">Comfortable</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Default View</Label>
                  <RadioGroup
                    defaultValue={displaySettings.defaultView}
                    onValueChange={(value) =>
                      handleDisplayChange("defaultView", value)
                    }
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="table" id="view-table" />
                      <Label htmlFor="view-table">Table</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="grid" id="view-grid" />
                      <Label htmlFor="view-grid">Grid</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={displaySettings.language}
                    onValueChange={(value) =>
                      handleDisplayChange("language", value)
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={displaySettings.timezone}
                    onValueChange={(value) =>
                      handleDisplayChange("timezone", value)
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">
                        Eastern Time (ET)
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time (CT)
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time (MT)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time (PT)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Greenwich Mean Time (GMT)
                      </SelectItem>
                      <SelectItem value="Europe/Paris">
                        Central European Time (CET)
                      </SelectItem>
                      <SelectItem value="Asia/Tokyo">
                        Japan Standard Time (JST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Inventory Settings */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>
                Configure inventory thresholds and reordering preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="low-stock">Low Stock Threshold</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="low-stock"
                      type="number"
                      value={inventorySettings.lowStockThreshold}
                      onChange={(e) =>
                        handleInventoryChange(
                          "lowStockThreshold",
                          e.target.value
                        )
                      }
                    />
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Products below this threshold will be marked as low stock.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical-stock">
                    Critical Stock Threshold
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="critical-stock"
                      type="number"
                      value={inventorySettings.criticalStockThreshold}
                      onChange={(e) =>
                        handleInventoryChange(
                          "criticalStockThreshold",
                          e.target.value
                        )
                      }
                    />
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Products below this threshold will be marked as critical.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-reorder" className="font-medium">
                      Auto Reorder
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create purchase orders for low stock items.
                    </p>
                  </div>
                  <Switch
                    id="auto-reorder"
                    checked={inventorySettings.autoReorder}
                    onCheckedChange={(checked) =>
                      handleInventoryChange("autoReorder", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorder-lead-time">Reorder Lead Time</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="reorder-lead-time"
                      type="number"
                      value={inventorySettings.reorderLeadTime}
                      onChange={(e) =>
                        handleInventoryChange("reorderLeadTime", e.target.value)
                      }
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average time between placing an order and receiving it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-supplier">Default Supplier</Label>
                  <Select
                    value={inventorySettings.defaultSupplier}
                    onValueChange={(value) =>
                      handleInventoryChange("defaultSupplier", value)
                    }
                  >
                    <SelectTrigger id="default-supplier">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sam's Club">
                        Sam&apos;s Club
                      </SelectItem>
                      <SelectItem value="Costco">Costco</SelectItem>
                      <SelectItem value="US Foods">US Foods</SelectItem>
                      <SelectItem value="Sysco">Sysco</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">Beverages</p>
                      <p className="text-sm text-muted-foreground">
                        Drinks, water, soda
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">Snacks</p>
                      <p className="text-sm text-muted-foreground">
                        Chips, candy, cookies
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">Fresh Food</p>
                      <p className="text-sm text-muted-foreground">
                        Sandwiches, salads
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">Other</p>
                      <p className="text-sm text-muted-foreground">
                        Miscellaneous items
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  + Add Category
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Session Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome on Windows • New York, USA • Active now
                      </p>
                    </div>
                    <Badge>Current</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-sm text-muted-foreground">
                        iPhone • New York, USA • Last active 2 hours ago
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Logout
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Tablet</p>
                      <p className="text-sm text-muted-foreground">
                        iPad • Boston, USA • Last active 3 days ago
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Logout
                    </Button>
                  </div>
                </div>
                <Button variant="outline">Logout of All Sessions</Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Danger Zone</h3>
                <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                  <h4 className="font-medium text-red-700">Delete Account</h4>
                  <p className="text-sm text-red-600 mt-1 mb-3">
                    Once you delete your account, there is no going back. This
                    action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
