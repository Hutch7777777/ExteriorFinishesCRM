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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Bell, 
  Users, 
  Building2, 
  Database, 
  FileText, 
  Monitor,
  Moon,
  Sun,
  Check,
  X,
  AlertTriangle,
  Settings as SettingsIcon,
  UserPlus,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Badge as BadgeIcon
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

  // Mock team data - in real app this would come from API
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john@exteriorfinishes.com",
      role: "admin",
      division: "All Divisions",
      status: "active",
      lastLogin: "2 hours ago",
      joinedDate: "Jan 15, 2024"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@exteriorfinishes.com", 
      role: "staff",
      division: "MFNC",
      status: "active",
      lastLogin: "1 day ago",
      joinedDate: "Mar 22, 2024"
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@exteriorfinishes.com",
      role: "staff", 
      division: "R&R",
      status: "active",
      lastLogin: "3 days ago",
      joinedDate: "Feb 8, 2024"
    },
    {
      id: 4,
      name: "Lisa Rodriguez",
      email: "lisa@exteriorfinishes.com",
      role: "staff",
      division: "SFNC", 
      status: "inactive",
      lastLogin: "2 weeks ago",
      joinedDate: "Dec 5, 2023"
    }
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'staff',
    division: 'MFNC'
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newMember = {
      id: teamMembers.length + 1,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      division: newUser.division,
      status: "active",
      lastLogin: "Never",
      joinedDate: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    };

    setTeamMembers([...teamMembers, newMember]);
    setNewUser({ name: '', email: '', role: 'staff', division: 'MFNC' });
    setShowAddUser(false);
    
    toast({
      title: "Team Member Added",
      description: `${newUser.name} has been added to the team.`
    });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      division: user.division
    });
  };

  const handleUpdateUser = () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setTeamMembers(teamMembers.map(member => 
      member.id === editingUser.id 
        ? { ...member, ...newUser }
        : member
    ));
    
    setEditingUser(null);
    setNewUser({ name: '', email: '', role: 'staff', division: 'MFNC' });
    
    toast({
      title: "Team Member Updated",
      description: `${newUser.name}'s information has been updated.`
    });
  };

  const handleDeleteUser = (userId) => {
    const user = teamMembers.find(m => m.id === userId);
    setTeamMembers(teamMembers.filter(member => member.id !== userId));
    
    toast({
      title: "Team Member Removed",
      description: `${user?.name} has been removed from the team.`
    });
  };

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
          <TabsTrigger value="team">Team</TabsTrigger>
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

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage team members, roles, and permissions within your CRM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Overview Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
                  <div className="text-sm text-blue-600/70">Total Members</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {teamMembers.filter(m => m.status === 'active').length}
                  </div>
                  <div className="text-sm text-green-600/70">Active</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {teamMembers.filter(m => m.role === 'admin').length}
                  </div>
                  <div className="text-sm text-orange-600/70">Admins</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {teamMembers.filter(m => m.role === 'staff').length}
                  </div>
                  <div className="text-sm text-purple-600/70">Staff</div>
                </div>
              </div>

              {/* Add New Team Member Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium">Team Members</h4>
                  <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
                </div>
                <Dialog open={showAddUser || editingUser} onOpenChange={(open) => {
                  if (!open) {
                    setShowAddUser(false);
                    setEditingUser(null);
                    setNewUser({ name: '', email: '', role: 'staff', division: 'MFNC' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setShowAddUser(true)}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? 'Edit Team Member' : 'Add New Team Member'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingUser 
                          ? 'Update the team member\'s information below.'
                          : 'Enter the details for the new team member.'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="division">Division</Label>
                        <Select value={newUser.division} onValueChange={(value) => setNewUser(prev => ({ ...prev, division: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Divisions">All Divisions</SelectItem>
                            <SelectItem value="MFNC">MFNC</SelectItem>
                            <SelectItem value="SFNC">SFNC</SelectItem>
                            <SelectItem value="R&R">R&R</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => {
                          setShowAddUser(false);
                          setEditingUser(null);
                          setNewUser({ name: '', email: '', role: 'staff', division: 'MFNC' });
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={editingUser ? handleUpdateUser : handleAddUser}>
                          {editingUser ? 'Update Member' : 'Add Member'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Team Members List */}
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h5 className="font-medium">{member.name}</h5>
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                            <Badge variant={member.status === 'active' ? 'outline' : 'destructive'} className={
                              member.status === 'active' ? 'text-green-600 border-green-600' : ''
                            }>
                              {member.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                            <span>{member.division}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {member.joinedDate}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Last login: {member.lastLogin}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(member)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.name} from the team? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(member.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Role Permissions Summary */}
              <Separator />
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Role Permissions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BadgeIcon className="w-5 h-5 text-orange-600" />
                      <h5 className="font-medium">Administrator</h5>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Full system access</li>
                      <li>• Manage all divisions</li>
                      <li>• User management</li>
                      <li>• System settings</li>
                      <li>• Data export/import</li>
                    </ul>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h5 className="font-medium">Staff</h5>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Division-specific access</li>
                      <li>• Lead management</li>
                      <li>• Customer records</li>
                      <li>• Project tracking</li>
                      <li>• Reports viewing</li>
                    </ul>
                  </Card>
                </div>
              </div>

              <Button onClick={() => handleSave('Team')}>Save Team Settings</Button>
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