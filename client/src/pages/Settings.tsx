import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Building2, 
  Database, 
  FileText, 
  Users, 
  Monitor,
  Moon,
  Sun,
  Check,
  X,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    leadUpdates: true,
    projectAlerts: true,
    systemMaintenance: false,
  });

  const handleSave = (category: string) => {
    toast({
      title: "Settings Saved",
      description: `${category} settings have been updated successfully.`,
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account preferences and system configuration.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john.doe@exteriorfinishes.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" placeholder="Project Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mfnc">MFNC - Multifamily</SelectItem>
                    <SelectItem value="sfnc">SFNC - Single Family</SelectItem>
                    <SelectItem value="rr">R&R - Repair & Retrofit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSave('Profile')}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and account security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Security Options</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button onClick={() => handleSave('Security')}>Update Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about updates and changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                  </div>
                  <Switch 
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>
                <Separator />
                <h4 className="text-sm font-medium">Notification Types</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lead Updates</Label>
                    <p className="text-sm text-muted-foreground">New leads and status changes</p>
                  </div>
                  <Switch 
                    checked={notifications.leadUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, leadUpdates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Project Alerts</Label>
                    <p className="text-sm text-muted-foreground">Project deadlines and milestones</p>
                  </div>
                  <Switch 
                    checked={notifications.projectAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, projectAlerts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Maintenance</Label>
                    <p className="text-sm text-muted-foreground">Scheduled maintenance and downtime</p>
                  </div>
                  <Switch 
                    checked={notifications.systemMaintenance}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, systemMaintenance: checked }))
                    }
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('Notifications')}>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance & Theme
              </CardTitle>
              <CardDescription>
                Customize how your interface looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Theme Preference</Label>
                  <p className="text-sm text-muted-foreground mb-3">Choose your preferred color scheme</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                      <Sun className="w-6 h-6" />
                      <span className="text-sm">Light</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                      <Moon className="w-6 h-6" />
                      <span className="text-sm">Dark</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                      <Monitor className="w-6 h-6" />
                      <span className="text-sm">System</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Sidebar Position</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Left (Default)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Density</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Comfortable (Default)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => handleSave('Appearance')}>Save Appearance Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Settings
              </CardTitle>
              <CardDescription>
                Manage company-wide settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="Exterior Finishes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input id="companyAddress" placeholder="123 Business St, City, State 12345" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone Number</Label>
                  <Input id="companyPhone" placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email Address</Label>
                  <Input id="companyEmail" type="email" placeholder="info@exteriorfinishes.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input id="companyWebsite" placeholder="https://www.exteriorfinishes.com" />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Business Settings</h4>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="USD - US Dollar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pacific Time (PT)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                      <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                      <SelectItem value="cst">Central Time (CT)</SelectItem>
                      <SelectItem value="est">Eastern Time (ET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => handleSave('Company')}>Save Company Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Information
              </CardTitle>
              <CardDescription>
                View system status and manage advanced settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>System Version</Label>
                  <div className="text-sm">v2.1.0</div>
                </div>
                <div className="space-y-2">
                  <Label>Database Status</Label>
                  <Badge variant="outline" className="text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Last Backup</Label>
                  <div className="text-sm">August 18, 2025 at 2:00 AM</div>
                </div>
                <div className="space-y-2">
                  <Label>Storage Used</Label>
                  <div className="text-sm">2.4 GB of 10 GB</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Data Management</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">Daily backups at 2:00 AM</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Retention</Label>
                    <p className="text-sm text-muted-foreground">Keep data for 7 years</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Advanced Actions
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    User Audit Log
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}