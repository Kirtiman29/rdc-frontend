// src/ai/pages/Profile.tsx
import { User, Mail, Calendar, Camera, Save } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "Alex Designer",
    email: "alex@textilestudio.ai",
    bio: "Textile pattern designer specializing in ethnic and floral motifs. 5+ years of experience in digital textile design.",
    company: "Studio Fabrica",
    location: "Mumbai, India",
  });

  const handleSave = () => {
    toast({ title: "Profile updated", description: "Your changes have been saved." });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Avatar Section */}
      <div className="rounded-xl bg-card border border-border p-6 flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">AD</AvatarFallback>
          </Avatar>
          <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-5 w-5 text-white" />
          </button>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Joined March 2025
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Designs Created", value: "124" },
          { label: "Favorites", value: "38" },
          { label: "Downloads", value: "1.2K" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center">
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <Separator />

      {/* Form */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Personal Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gradient-primary glow-red">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="rounded-xl bg-card border border-destructive/30 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
        <Button variant="destructive" size="sm">Delete Account</Button>
      </div>
    </div>
  );
}
