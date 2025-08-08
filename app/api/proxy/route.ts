import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Use axios to fetch the OpenAPI spec
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json, text/html',
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
      responseType: 'text', // Get response as text to handle both JSON and HTML
    });

    // Check if the response is HTML (authentication page)
    const contentType = response.headers['content-type'] || '';
    const isHtml = contentType.includes('text/html') ||
                  (response.data && typeof response.data === 'string' &&
                   response.data.trim().startsWith('<!DOCTYPE html>'));

    if (isHtml) {
      // Return HTML with a flag indicating it's an authentication page
      return NextResponse.json({
        isAuthPage: true,
        htmlContent: response.data
      });
    } else {
      // Parse the response as JSON if it's not HTML
      let jsonData;
      try {
        jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } catch (e) {
        throw new Error('Invalid JSON response');
      }
      return NextResponse.json(jsonData);
    }
  } catch (error) {
    console.error('Proxy error:', error);

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.statusText || error.message;

      return NextResponse.json(
        {
          error: `Failed to fetch OpenAPI specification: ${message}`,
          details: error.message,
          status: status
        },
        { status: status }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: 'Failed to fetch OpenAPI specification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
