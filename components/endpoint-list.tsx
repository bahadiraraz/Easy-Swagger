"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EndpointInfo, simplifyMethodInfoForCopy } from "@/lib/openapi";
import { Copy, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";

interface EndpointListProps {
  endpoints: Record<string, EndpointInfo>;
  onSelectEndpoint: (endpoint: string) => void;
}

// Group type for organizing endpoints
type EndpointGroup = {
  name: string;
  endpoints: [string, EndpointInfo][];
};

export function EndpointList({ endpoints, onSelectEndpoint }: EndpointListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Load expanded groups from localStorage on mount
  useEffect(() => {
    const savedExpandedGroups = localStorage.getItem("swagger-expanded-groups");
    if (savedExpandedGroups) {
      try {
        const parsedGroups = JSON.parse(savedExpandedGroups);
        setExpandedGroups(parsedGroups);
      } catch (err) {
        console.error("Error parsing saved expanded groups:", err);
        // If there's an error parsing the saved groups, remove it from localStorage
        localStorage.removeItem("swagger-expanded-groups");
      }
    }
  }, []);

  // Filter endpoints based on search term
  const filteredEndpoints = Object.entries(endpoints).filter(([path]) =>
    path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-expand all groups when searching
  useEffect(() => {
    if (searchTerm) {
      // Create a record with all groups expanded, but preserve existing state
      setExpandedGroups(prevState => {
        const allExpanded = { ...prevState };
        groupEndpoints(filteredEndpoints).forEach(group => {
          // Only set to true if not already set (preserves collapsed state)
          if (!(group.name in allExpanded)) {
            allExpanded[group.name] = true;
          }
        });
        return allExpanded;
      });
    }
  }, [searchTerm]); // Remove filteredEndpoints from dependencies

  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newState = {
        ...prev,
        [groupName]: !prev[groupName]
      };

      // Save to localStorage
      localStorage.setItem("swagger-expanded-groups", JSON.stringify(newState));

      return newState;
    });
  };

  // Toggle endpoint expansion
  const toggleEndpointExpansion = (path: string, info: EndpointInfo) => {
    if (expandedEndpoint === path) {
      // If already expanded, collapse it
      setExpandedEndpoint(null);
      setSelectedMethod(null);
    } else {
      // If not expanded, expand it and select the first method
      setExpandedEndpoint(path);
      const firstMethod = Object.keys(info.methods)[0] || null;
      setSelectedMethod(firstMethod);
    }
  };

  // Handle method selection for expanded endpoint
  const handleMethodSelection = (method: string) => {
    setSelectedMethod(method);
  };

  // Group endpoints by tags and path segments
  const groupEndpoints = (endpoints: [string, EndpointInfo][]): EndpointGroup[] => {
    // First, try to group by tags
    const tagGroups: Record<string, [string, EndpointInfo][]> = {};
    const noTagEndpoints: [string, EndpointInfo][] = [];

    // Group by tags first
    endpoints.forEach(([path, info]) => {
      const methodValues = Object.values(info.methods);
      if (methodValues.length > 0 && methodValues[0].tags.length > 0) {
        // Use the first tag as the group name
        const tag = methodValues[0].tags[0];
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }
        tagGroups[tag].push([path, info]);
      } else {
        noTagEndpoints.push([path, info]);
      }
    });

    // For endpoints without tags, group by path segment
    const pathGroups: Record<string, [string, EndpointInfo][]> = {};
    noTagEndpoints.forEach(([path, info]) => {
      // Extract the first path segment (e.g., /v1/users -> /v1)
      const pathSegments = path.split('/');
      let groupName = '/';

      if (pathSegments.length > 1 && pathSegments[1]) {
        groupName = '/' + pathSegments[1];
      }

      if (!pathGroups[groupName]) {
        pathGroups[groupName] = [];
      }
      pathGroups[groupName].push([path, info]);
    });

    // Combine tag groups and path groups
    const allGroups: EndpointGroup[] = [
      ...Object.entries(tagGroups).map(([name, endpoints]) => ({ name, endpoints })),
      ...Object.entries(pathGroups).map(([name, endpoints]) => ({ name, endpoints }))
    ];

    // Sort groups by name
    return allGroups.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Group the filtered endpoints
  const endpointGroups = groupEndpoints(filteredEndpoints);

  // Copy endpoint information as JSON
  const copyEndpointJson = (path: string, info: EndpointInfo) => {
    // Create a simplified version of the methods
    const simplifiedMethods: Record<string, any> = {};

    // Simplify each method
    Object.entries(info.methods).forEach(([method, methodInfo]) => {
      simplifiedMethods[method] = simplifyMethodInfoForCopy(methodInfo);
    });

    const endpointData = {
      endpoint: path,
      methods: simplifiedMethods
    };

    navigator.clipboard.writeText(JSON.stringify(endpointData, null, 2))
      .then(() => {
        // Using window object to access toast from anywhere
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.success("Endpoint information copied to clipboard!");
        }
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard:", err);
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error("Failed to copy to clipboard");
        }
      });
  };

  // Get HTTP method color
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500";
      case "POST":
        return "bg-green-500";
      case "PUT":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      case "PATCH":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Endpoints</CardTitle>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Search endpoints..."
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto">
        {filteredEndpoints.length === 0 ? (
          <p className="text-center text-gray-500">No endpoints found</p>
        ) : (
          <div className="space-y-4">
            {endpointGroups.map((group) => {
              const isExpanded = expandedGroups[group.name] !== false; // Default to expanded

              return (
                <div key={group.name} className="border rounded overflow-hidden">
                  {/* Group Header */}
                  <div
                    className="bg-gray-100 p-3 font-semibold flex items-center cursor-pointer hover:bg-gray-200 border-b"
                    onClick={() => toggleGroup(group.name)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2 text-gray-600" />
                    )}
                    <span className="text-gray-800">{group.name}</span>
                    <Badge variant="outline" className="ml-2 bg-white">
                      {group.endpoints.length}
                    </Badge>
                  </div>

                  {/* Group Content */}
                  {isExpanded && (
                    <ul className="divide-y">
                      {group.endpoints.map(([path, info]) => (
                        <li key={path} className="p-3 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-mono text-sm font-semibold mb-2">{path}</h3>
                              <div className="flex flex-wrap gap-1">
                                {Object.keys(info.methods).map((method) => (
                                  <Badge key={method} className={getMethodColor(method)}>
                                    {method}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyEndpointJson(path, info)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleEndpointExpansion(path, info)}
                              >
                                {expandedEndpoint === path ? 'Hide' : 'View'}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Endpoint Details */}
                          {expandedEndpoint === path && selectedMethod && (
                            <div className="mt-4 border-t pt-4">
                              <div className="flex flex-wrap gap-2 mb-4">
                                {Object.keys(info.methods).map((method) => (
                                  <Badge
                                    key={method}
                                    className={`${getMethodColor(method)} cursor-pointer ${
                                      selectedMethod === method ? 'ring-2 ring-offset-2' : ''
                                    }`}
                                    onClick={() => handleMethodSelection(method)}
                                  >
                                    {method}
                                  </Badge>
                                ))}
                              </div>

                              <div className="space-y-6">
                                {/* Method Details */}
                                {(() => {
                                  const methodInfo = info.methods[selectedMethod];

                                  return (
                                    <>
                                      {/* Tags */}
                                      {methodInfo.tags && methodInfo.tags.length > 0 && (
                                        <div>
                                          <h3 className="text-sm font-semibold mb-1">Tags:</h3>
                                          <div className="flex flex-wrap gap-1">
                                            {methodInfo.tags.map((tag) => (
                                              <Badge key={tag} variant="outline">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Parameters */}
                                      {methodInfo.parameters && methodInfo.parameters.length > 0 && (
                                        <div>
                                          <h3 className="text-sm font-semibold mb-1">Parameters:</h3>
                                          <div className="space-y-2">
                                            {methodInfo.parameters.map((param, index) => (
                                              <div key={index} className="border rounded p-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-semibold">{param.name}</span>
                                                  <Badge variant="outline" className="text-xs">
                                                    {param.in}
                                                  </Badge>
                                                  {param.required && (
                                                    <Badge variant="destructive" className="text-xs">
                                                      required
                                                    </Badge>
                                                  )}
                                                </div>
                                                {param.schema && (
                                                  <div className="mt-1 text-sm">
                                                    <span className="text-gray-500">Type: </span>
                                                    <span>{param.schema.type || "object"}</span>
                                                    {param.schema.format && (
                                                      <span className="ml-2 text-gray-500">
                                                        Format: {param.schema.format}
                                                      </span>
                                                    )}
                                                    {param.schema.enumValues && (
                                                      <div className="mt-1">
                                                        <span className="text-gray-500">Enum values: </span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                          {param.schema.enumValues.map((value: string) => (
                                                            <Badge key={value} variant="secondary" className="text-xs">
                                                              {value}
                                                            </Badge>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Request Body */}
                                      {methodInfo.requestBody && (
                                        <div>
                                          <h3 className="text-sm font-semibold mb-1">Request Body:</h3>
                                          {methodInfo.requestBody.content ? (
                                            (() => {
                                              // Extract the first schema from any content type
                                              const contentTypes = Object.keys(methodInfo.requestBody.content);
                                              if (contentTypes.length === 0) {
                                                return (
                                                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(methodInfo.requestBody, null, 2)}
                                                  </pre>
                                                );
                                              }

                                              // Get the first content type's schema
                                              const firstContentType = contentTypes[0];
                                              const schema = methodInfo.requestBody.content[firstContentType].schema;

                                              // Display all content types as badges
                                              return (
                                                <div className="border rounded p-2">
                                                  <div className="flex flex-wrap gap-1 mb-3">
                                                    {contentTypes.map(contentType => (
                                                      <Badge key={contentType} variant="outline" className="text-xs">
                                                        {contentType}
                                                      </Badge>
                                                    ))}
                                                  </div>

                                                  {schema && (
                                                    <div>
                                                      {/* Display schema properties directly */}
                                                      {schema.properties ? (
                                                        <div className="space-y-2">
                                                          {Object.entries(schema.properties).map(([propName, propValue]: [string, any]) => (
                                                            <div key={propName} className="border-l-2 border-gray-300 pl-2 py-1">
                                                              <div className="flex items-center gap-2">
                                                                <span className="font-medium">{propName}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                  {propValue.type || "any"}
                                                                </Badge>
                                                                {propValue.nullable && (
                                                                  <Badge variant="secondary" className="text-xs">
                                                                    nullable
                                                                  </Badge>
                                                                )}
                                                              </div>
                                                              {propValue.description && (
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                  {propValue.description}
                                                                </div>
                                                              )}
                                                              {/* Handle nested objects */}
                                                              {propValue.type === "object" && propValue.properties && (
                                                                <div className="mt-1 pl-2">
                                                                  <div className="text-xs font-medium mb-1">Nested Properties:</div>
                                                                  <div className="space-y-1">
                                                                    {Object.entries(propValue.properties).map(([nestedPropName, nestedPropValue]: [string, any]) => (
                                                                      <div key={nestedPropName} className="border-l border-gray-200 pl-2">
                                                                        <div className="flex items-center gap-1">
                                                                          <span className="text-xs font-medium">{nestedPropName}</span>
                                                                          <Badge variant="outline" className="text-[10px] h-4">
                                                                            {nestedPropValue.type || "any"}
                                                                          </Badge>
                                                                          {nestedPropValue.nullable && (
                                                                            <Badge variant="secondary" className="text-[10px] h-4">
                                                                              nullable
                                                                            </Badge>
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              )}
                                                              {/* Handle arrays of objects */}
                                                              {propValue.type === "array" && propValue.items && propValue.items.type === "object" && propValue.items.properties && (
                                                                <div className="mt-1 pl-2">
                                                                  <div className="text-xs font-medium mb-1">Array Item Properties:</div>
                                                                  <div className="space-y-1">
                                                                    {Object.entries(propValue.items.properties).map(([arrayPropName, arrayPropValue]: [string, any]) => (
                                                                      <div key={arrayPropName} className="border-l border-gray-200 pl-2">
                                                                        <div className="flex items-center gap-1">
                                                                          <span className="text-xs font-medium">{arrayPropName}</span>
                                                                          <Badge variant="outline" className="text-[10px] h-4">
                                                                            {arrayPropValue.type || "any"}
                                                                          </Badge>
                                                                          {arrayPropValue.nullable && (
                                                                            <Badge variant="secondary" className="text-[10px] h-4">
                                                                              nullable
                                                                            </Badge>
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                                          {JSON.stringify(schema, null, 2)}
                                                        </pre>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()
                                          ) : (
                                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                              {JSON.stringify(methodInfo.requestBody, null, 2)}
                                            </pre>
                                          )}
                                        </div>
                                      )}

                                      {/* Responses */}
                                      {Object.keys(methodInfo.responses).length > 0 && (
                                        <div>
                                          <h3 className="text-sm font-semibold mb-1">Responses:</h3>
                                          <div className="space-y-2">
                                            {Object.entries(methodInfo.responses).map(([code, response]) => (
                                              <div key={code} className="border rounded p-2">
                                                <div className="font-semibold">
                                                  Status Code: {code}
                                                  {response.description && (
                                                    <span className="ml-2 font-normal text-gray-500">
                                                      {response.description}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Copy JSON Button */}
                                      <div className="flex justify-end pt-4 border-t">
                                        <Button
                                          onClick={() => {
                                            const endpointData = {
                                              endpoint: path,
                                              methods: {
                                                [selectedMethod]: simplifyMethodInfoForCopy(methodInfo)
                                              }
                                            };

                                            navigator.clipboard.writeText(JSON.stringify(endpointData, null, 2))
                                              .then(() => {
                                                if (typeof window !== 'undefined' && window.toast) {
                                                  window.toast.success("Endpoint information copied to clipboard!");
                                                }
                                              })
                                              .catch((err) => {
                                                console.error("Failed to copy to clipboard:", err);
                                                if (typeof window !== 'undefined' && window.toast) {
                                                  window.toast.error("Failed to copy to clipboard");
                                                }
                                              });
                                          }}
                                          className="gap-2"
                                        >
                                          <Copy className="h-4 w-4" />
                                          Copy JSON
                                        </Button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
