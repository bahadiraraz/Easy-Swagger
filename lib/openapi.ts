// Types for OpenAPI specification
export type OpenAPISpec = {
  paths?: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, any>;
  };
  openapi?: string;
  swagger?: string;
  [key: string]: any;
};

export type PathItem = {
  [method: string]: MethodInfo;
};

export type MethodInfo = {
  tags?: string[];
  parameters?: Parameter[];
  responses?: Record<string, any>;
  requestBody?: any;
  [key: string]: any;
};

export type Parameter = {
  name: string;
  in: string;
  schema?: {
    $ref?: string;
    type?: string;
    format?: string;
    enum?: string[];
    [key: string]: any;
  };
  [key: string]: any;
};

export type EndpointInfo = {
  endpoint: string;
  methods: Record<string, {
    tags: string[];
    parameters: Parameter[];
    responses: Record<string, any>;
    requestBody?: any;
  }>;
  error?: string;
};

/**
 * Fetch OpenAPI specification from a URL
 */
export async function fetchOpenAPISpec(url: string): Promise<OpenAPISpec> {
  try {
    // Use our proxy API route to avoid CORS issues
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      // Try to parse error details from the response
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to fetch OpenAPI specification: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Validate that the response is a valid OpenAPI spec
    if (!data || typeof data !== 'object' || (!data.paths && !data.openapi && !data.swagger)) {
      throw new Error('Invalid OpenAPI specification format');
    }

    return data;
  } catch (error) {
    console.error("Error fetching OpenAPI spec:", error);
    throw error;
  }
}

/**
 * Resolve a schema reference from #/components/schemas/
 */
export function resolveSchemaRef(openApiSpec: OpenAPISpec, ref: string): any {
  if (!ref || !ref.startsWith('#/components/schemas/')) {
    return {};
  }

  const schemaName = ref.split('/').pop();
  return openApiSpec.components?.schemas?.[schemaName as string] || {};
}

/**
 * Recursively resolve schema references in an object
 */
export function resolveReferences(openApiSpec: OpenAPISpec, obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // If it's an array, resolve references for each item
  if (Array.isArray(obj)) {
    return obj.map(item => resolveReferences(openApiSpec, item));
  }

  // If it has a $ref property, resolve it
  if (obj.$ref && typeof obj.$ref === 'string') {
    const resolved = resolveSchemaRef(openApiSpec, obj.$ref);
    // Merge the resolved schema with the original object (excluding $ref)
    const { $ref, ...rest } = obj;
    // Recursively resolve any nested references in the resolved schema
    const resolvedWithNestedRefs = resolveReferences(openApiSpec, resolved);
    return { ...resolvedWithNestedRefs, ...rest };
  }

  // Special handling for objects with content and schema (request bodies and responses)
  if (obj.content && typeof obj.content === 'object') {
    const result = { ...obj };

    // Process each content type (application/json, text/json, etc.)
    for (const [contentType, contentValue] of Object.entries(obj.content)) {
      // @ts-ignore
      if (contentValue && typeof contentValue === 'object' && contentValue.schema) {
        // Recursively resolve any references in the schema
        result.content[contentType] = {
          ...contentValue,
          // @ts-ignore
          schema: resolveReferences(openApiSpec, contentValue.schema)
        };
      }
    }

    return result;
  }

  // Special handling for responses that might contain content
  if (obj.responses && typeof obj.responses === 'object') {
    const result = { ...obj };

    // Process each response
    for (const [statusCode, responseValue] of Object.entries(obj.responses)) {
      if (responseValue && typeof responseValue === 'object') {
        // Recursively resolve any references in the response
        result.responses[statusCode] = resolveReferences(openApiSpec, responseValue);
      }
    }

    return result;
  }

  // Otherwise, recursively resolve references for all properties
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveReferences(openApiSpec, value);
  }

  return result;
}

/**
 * Extract all information about a specific endpoint from OpenAPI specification
 */
export function extractEndpointInfo(openApiSpec: OpenAPISpec, targetEndpoint: string): EndpointInfo {
  if (!openApiSpec.paths || !openApiSpec.paths[targetEndpoint]) {
    return {
      endpoint: targetEndpoint,
      methods: {},
      error: `Endpoint ${targetEndpoint} not found in the OpenAPI specification`
    };
  }

  const pathInfo = openApiSpec.paths[targetEndpoint];
  const result: EndpointInfo = {
    endpoint: targetEndpoint,
    methods: {}
  };

  // Extract information for each HTTP method
  for (const [method, methodInfo] of Object.entries(pathInfo)) {
    if (typeof methodInfo !== 'object') continue;

    const methodData = {
      tags: methodInfo.tags || [],
      parameters: [],
      responses: methodInfo.responses || {},
      ...(methodInfo.requestBody ? {
        requestBody: resolveReferences(openApiSpec, methodInfo.requestBody)
      } : {})
    };

    // Process parameters and resolve any schema references
    for (const param of (methodInfo.parameters || [])) {
      const paramInfo = { ...param };

      // If parameter schema is a reference, resolve it
      if (paramInfo.schema && paramInfo.schema.$ref) {
        const refSchema = resolveSchemaRef(openApiSpec, paramInfo.schema.$ref);
        // Recursively resolve any nested references in the resolved schema
        const resolvedWithNestedRefs = resolveReferences(openApiSpec, refSchema);
        paramInfo.schema = { ...resolvedWithNestedRefs };

        // Remove the $ref since we've resolved it
        // @ts-ignore
        delete paramInfo.schema.$ref;
      }

      // @ts-ignore
      methodData.parameters.push(paramInfo);
    }

    result.methods[method.toUpperCase()] = methodData;
  }

  return result;
}

/**
 * Extract all endpoints from OpenAPI specification
 */
export function extractAllEndpoints(openApiSpec: OpenAPISpec): string[] {
  if (!openApiSpec.paths) {
    return [];
  }

  return Object.keys(openApiSpec.paths);
}

/**
 * Get detailed information for all endpoints
 */
export function getAllEndpointsInfo(openApiSpec: OpenAPISpec): Record<string, EndpointInfo> {
  if (!openApiSpec.paths) {
    return {};
  }

  const endpoints = extractAllEndpoints(openApiSpec);
  const result: Record<string, EndpointInfo> = {};

  for (const endpoint of endpoints) {
    result[endpoint] = extractEndpointInfo(openApiSpec, endpoint);
  }

  return result;
}

/**
 * Simplify method info for copying to clipboard
 * Extracts essential information and simplifies request body format
 */
export function simplifyMethodInfoForCopy(methodInfo: any): any {
  // Create a copy of the method info to avoid modifying the original
  const simplifiedInfo = { ...methodInfo };

  // Simplify request body if it exists
  if (simplifiedInfo.requestBody && simplifiedInfo.requestBody.content) {
    const contentTypes = Object.keys(simplifiedInfo.requestBody.content);

    if (contentTypes.length > 0) {
      // Get the first content type's schema
      const firstContentType = contentTypes[0];
      const schema = simplifiedInfo.requestBody.content[firstContentType].schema;

      if (schema && schema.properties) {
        // Create a simplified request body with just the properties
        const simplifiedRequestBody: Record<string, any> = {};

        // For each property, add it to the simplified request body with a simple value
        Object.entries(schema.properties).forEach(([propName, propValue]: [string, any]) => {
          // Use the property type to determine a simple value
          let simpleValue: any = "string";

          if (propValue.type === "integer" || propValue.type === "number") {
            simpleValue = 0;
          } else if (propValue.type === "boolean") {
            simpleValue = false;
          } else if (propValue.type === "array") {
            simpleValue = [];
          } else if (propValue.type === "object") {
            simpleValue = {};
          }

          simplifiedRequestBody[propName] = simpleValue;
        });

        // Replace the original request body with the simplified one
        simplifiedInfo.requestBody = simplifiedRequestBody;
      }
    }
  }

  return simplifiedInfo;
}
