import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

const WebsiteSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website Configuration</CardTitle>
          <CardDescription>Customize website appearance and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Website Title</Label>
            <Input defaultValue="LakToken" placeholder="Enter website title" />
          </div>
          
          <div>
            <Label>Website Description</Label>
            <Input placeholder="Enter website description" />
          </div>

          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
              <span className="text-sm text-muted-foreground">
                Recommended: 200x50px, PNG or SVG
              </span>
            </div>
          </div>

          <div>
            <Label>Favicon</Label>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Favicon
              </Button>
              <span className="text-sm text-muted-foreground">
                Recommended: 32x32px, ICO or PNG
              </span>
            </div>
          </div>

          <Button>Save Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize color scheme and appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <Input type="color" defaultValue="#8B5CF6" />
            </div>
            <div>
              <Label>Secondary Color</Label>
              <Input type="color" defaultValue="#F59E0B" />
            </div>
          </div>
          <Button>Apply Theme</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteSettings;