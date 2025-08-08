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
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    return NextResponse.json(response.data);
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
