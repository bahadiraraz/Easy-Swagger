"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete
} from "@/components/ui/file-upload";
import { FileIcon, UploadIcon } from "lucide-react";

interface SwaggerUrlFormProps {
  onFetch: (url: string) => Promise<void>;
  onFileUpload: (fileContent: any) => Promise<void>;
  isLoading: boolean;
}

export function SwaggerUrlForm({ onFetch, onFileUpload, isLoading }: SwaggerUrlFormProps) {
  const [url, setUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load the last used URL from localStorage on component mount and fetch it if it exists
  const initialFetchRef = useRef(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem("swagger-url");
    if (savedUrl && !initialFetchRef.current) {
      setUrl(savedUrl);
      // Auto-fetch the URL if it exists in localStorage, but only once
      onFetch(savedUrl);
      initialFetchRef.current = true;
    }
  }, []); // Empty dependency array to ensure it only runs once

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "url") {
      if (!url.trim()) return;

      // Save URL to localStorage
      localStorage.setItem("swagger-url", url);

      // Call the onFetch callback with the URL
      await onFetch(url);
    }
  };

  const readFileAsJson = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          resolve(json);
        } catch (error) {
          reject(new Error("Invalid JSON file"));
        }
      };

      reader.onerror = () => reject(new Error("Error reading file"));

      reader.readAsText(file);
    });
  };

  const handleFileAccept = async (files: File[]) => {
    if (files.length === 0 || isLoading) return;

    const file = files[0]; // We only need the first file
    setSelectedFile(file); // Set the selected file state

    try {
      const fileContent = await readFileAsJson(file);

      // Save the file content to localStorage
      localStorage.setItem("swagger-file", JSON.stringify(fileContent));

      await onFileUpload(fileContent);
    } catch (error) {
      console.error("Error reading file:", error);
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error("Failed to read file. Please make sure it's a valid JSON file.");
      }
    }
  };

  const handleFileDelete = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-3xl">
      {selectedFile && (
        <div className="flex items-center justify-between p-2 mb-4 bg-accent/30 rounded-md">
          <div className="flex items-center gap-2">
            <FileIcon className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleFileDelete} className="h-8 w-8">✕</Button>
        </div>
      )}
      <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="url">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              type="url"
              placeholder="Enter OpenAPI/Swagger URL (e.g., https://example.com/swagger.json)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              required={activeTab === "url"}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isLoading ? "Loading..." : "Fetch"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="file">
          <div className="flex flex-col gap-4">
            <FileUpload
              accept=".json,application/json"
              maxFiles={1}
              disabled={isLoading}
              onAccept={handleFileAccept}
            >
              <FileUploadDropzone className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadIcon className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your OpenAPI/Swagger JSON file here
                  </p>
                  <FileUploadTrigger asChild>
                    <Button variant="outline" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Loading...
                        </>
                      ) : (
                        "Select File"
                      )}
                    </Button>
                  </FileUploadTrigger>
                </div>
              </FileUploadDropzone>
              {/* File information is now displayed at the top of the form */}
            </FileUpload>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
