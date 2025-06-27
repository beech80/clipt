import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notificationTester } from '../utils/notificationTester';
import { Loader2, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

/**
 * Browser Compatibility Tester for Push Notifications
 * 
 * This component provides a UI for testing push notification compatibility
 * across different browsers and devices.
 */
const BrowserCompatibilityTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [report, setReport] = useState('');
  const [activeTab, setActiveTab] = useState('test');
  
  const runTest = async () => {
    try {
      setIsLoading(true);
      await notificationTester.runFullTest();
      const generatedReport = notificationTester.generateReport();
      setReport(generatedReport);
      setTestComplete(true);
      setActiveTab('report');
      toast.success('Browser compatibility test complete');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('An error occurred during testing');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getBrowserInfo = () => {
    const info = notificationTester.getBrowserInfo();
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Browser:</span>
          <span className="text-sm">{info.name} {info.version}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Operating System:</span>
          <span className="text-sm">{info.os}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Device Type:</span>
          <span className="text-sm">{info.mobile ? 'Mobile' : 'Desktop'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Push API Support:</span>
          <Badge variant={info.supportsPush ? "success" : "destructive"}>
            {info.supportsPush ? 'Supported' : 'Not Supported'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Notifications API Support:</span>
          <Badge variant={info.supportsNotifications ? "success" : "destructive"}>
            {info.supportsNotifications ? 'Supported' : 'Not Supported'}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Push Notification Browser Compatibility Tester</CardTitle>
        <CardDescription>
          Test if push notifications work correctly on this browser and device
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="report" disabled={!testComplete}>Report</TabsTrigger>
          </TabsList>
        </div>
          
        <CardContent className="pt-6">
          <TabsContent value="test">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Test your browser compatibility</AlertTitle>
                <AlertDescription>
                  This will check if your current browser properly supports push notifications
                  and identify any potential issues.
                </AlertDescription>
              </Alert>
              
              <div className="rounded-md border p-4">
                <h3 className="text-sm font-medium mb-2">Current Browser Information</h3>
                {getBrowserInfo()}
              </div>
              
              <Button 
                onClick={runTest} 
                disabled={isLoading} 
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Testing...' : 'Run Compatibility Test'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="report">
            <div className="space-y-4">
              {testComplete ? (
                <div className="rounded-md border p-4 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Run a test first to see the compatibility report
                  </p>
                </div>
              )}
              
              {testComplete && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Test Completed</AlertTitle>
                  <AlertDescription>
                    Review the report above for detailed compatibility information.
                    If you encounter issues, try using a different browser (Chrome or Firefox recommended).
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Note: Push notification support varies by browser and device. Chrome, Firefox, and Edge
          generally offer the best compatibility.
        </p>
      </CardFooter>
    </Card>
  );
};

export default BrowserCompatibilityTester;
