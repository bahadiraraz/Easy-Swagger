"use client";

import { useState, useEffect } from "react";
import { SwaggerUrlForm } from "@/components/swagger-url-form";
import { EndpointList } from "@/components/endpoint-list";
import { AuthPageFrame } from "@/components/auth-page-frame";
import { fetchOpenAPISpec, getAllEndpointsInfo, extractEndpointInfo, type EndpointInfo, type OpenAPISpec, AuthPageError } from "@/lib/openapi";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Record<string, EndpointInfo>>({});
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [authPageData, setAuthPageData] = useState<{ htmlContent: string; url: string } | null>(null);

  const handleFetchOpenAPI = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedEndpoint(null);
    setAuthPageData(null);

    try {
      const openApiSpec = await fetchOpenAPISpec(url);
      const allEndpoints = getAllEndpointsInfo(openApiSpec);
      setEndpoints(allEndpoints);

      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success("OpenAPI specification loaded successfully!");
      }
    } catch (err) {
      console.error("Error fetching OpenAPI spec:", err);

      // Check if this is an authentication page error
      if (err instanceof AuthPageError) {
        setAuthPageData({
          htmlContent: err.htmlContent,
          url: url
        });
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch OpenAPI specification");
      }

      setEndpoints({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (fileContent: OpenAPISpec) => {
    setIsLoading(true);
    setError(null);
    setSelectedEndpoint(null);

    try {
      // Validate that the uploaded file is a valid OpenAPI spec
      if (!fileContent || typeof fileContent !== 'object' || (!fileContent.paths && !fileContent.openapi && !fileContent.swagger)) {
        throw new Error('Invalid OpenAPI specification format');
      }

      const allEndpoints = getAllEndpointsInfo(fileContent);
      setEndpoints(allEndpoints);

      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success("OpenAPI specification loaded successfully!");
      }
    } catch (err) {
      console.error("Error processing uploaded file:", err);
      setError(err instanceof Error ? err.message : "Failed to process OpenAPI specification");
      setEndpoints({});
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved file from localStorage on component mount
  useEffect(() => {
    const savedFile = localStorage.getItem("swagger-file");
    if (savedFile) {
      try {
        const fileContent = JSON.parse(savedFile);
        handleFileUpload(fileContent);
      } catch (err) {
        console.error("Error parsing saved file:", err);
        // If there's an error parsing the saved file, remove it from localStorage
        localStorage.removeItem("swagger-file");
      }
    }
  }, []);

  const handleSelectEndpoint = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
  };


  return (
    <div className="min-h-screen p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      <header className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-3">Easy Swagger</h1>
        <p className="text-gray-500 mb-2 text-lg">
          Enter an OpenAPI/Swagger URL or upload a file to explore and copy endpoint details
        </p>
        <p className="mt-2 mb-8">
          <a href="https://github.com/bahadiraraz" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            Made by bahadiraraz
          </a>
        </p>
        <div className="max-w-4xl mx-auto">
          <SwaggerUrlForm
            onFetch={handleFetchOpenAPI}
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mx-auto max-w-4xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <main className="flex-1 w-full">
        {authPageData && (
          <div className="max-w-4xl mx-auto">
            <AuthPageFrame
              htmlContent={authPageData.htmlContent}
              url={authPageData.url}
              onRetry={() => handleFetchOpenAPI(authPageData.url)}
            />
          </div>
        )}

        {!authPageData && Object.keys(endpoints).length > 0 && (
          <EndpointList
            endpoints={endpoints}
            onSelectEndpoint={handleSelectEndpoint}
          />
        )}

        {!isLoading && !authPageData && Object.keys(endpoints).length === 0 && !error && (
          <div className="text-center p-16 border rounded-lg shadow-sm bg-gray-50 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Easy Swagger</h2>
            <p className="text-gray-600 text-lg mb-2">
              Enter an OpenAPI/Swagger URL or upload a JSON file to get started
            </p>
            <p className="text-gray-500 text-sm">
              You can explore API endpoints, view their details, and copy the information as JSON
            </p>
          </div>
        )}
      </main>

      <footer className="text-center text-gray-500 text-sm py-4">
        <p>
          Easy Swagger - OpenAPI Specification Explorer
        </p>
      </footer>
    </div>
  );
}
