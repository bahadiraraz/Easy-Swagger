"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AuthPageFrameProps {
  htmlContent: string;
  url: string;
  onRetry: () => void;
}

export function AuthPageFrame({ htmlContent, url, onRetry }: AuthPageFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Set the HTML content to the iframe when it changes
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
      }
    }
  }, [htmlContent]);

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
        <div className="mb-4 text-sm text-gray-500">
          <p>The API endpoint requires authentication. Please sign in using the form below:</p>
          <p className="mt-1 font-medium text-gray-700">{url}</p>
        </div>

        <div className="border rounded-md overflow-hidden bg-white">
          <iframe
            ref={iframeRef}
            className="w-full h-[500px]"
            title="Authentication Page"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          />
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>
            After authentication, click the "Retry" button to fetch the API specification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
