"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";

interface AuthPageFrameProps {
  htmlContent: string;
  url: string;
  onRetry: () => void;
}

export function AuthPageFrame({ htmlContent, url, onRetry }: AuthPageFrameProps) {
  // Extract the authentication URL from the HTML content if possible
  const extractAuthUrl = (): string | null => {
    // Try to find a Cloudflare Access URL in the HTML
    const cloudflareUrlMatch = htmlContent.match(/https:\/\/[a-zA-Z0-9.-]+\.cloudflareaccess\.com[^"']+/);
    if (cloudflareUrlMatch) {
      return cloudflareUrlMatch[0];
    }

    // If no specific URL found, return the original URL
    return url;
  };

  const authUrl = extractAuthUrl();

  const handleOpenAuth = () => {
    // Open the authentication URL in a new tab
    window.open(authUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Authentication Required</CardTitle>
        <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-sm text-gray-500">
          <p>The API endpoint requires authentication with Cloudflare Access.</p>
          <p className="mt-1 font-medium text-gray-700">{url}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <h3 className="text-amber-800 font-medium mb-2">Authentication Required</h3>
          <p className="text-amber-700 mb-4">
            This API is protected by Cloudflare Access and requires authentication.
            You need to authenticate in a separate window before accessing the API.
          </p>

          <Button
            onClick={handleOpenAuth}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <ExternalLink className="h-4 w-4" />
            Open Authentication Page
          </Button>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Instructions:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
            <li>Click the button above to open the authentication page in a new tab</li>
            <li>Complete the authentication process in the new tab</li>
            <li>Return to this tab and click the &quot;Retry&quot; button to fetch the API specification</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
