import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    console.error(`Response not OK: ${res.status} ${res.statusText}`);
    try {
      // Check if response has content
      const clonedRes = res.clone();
      const text = await clonedRes.text();
      
      if (!text || text.trim() === '' || text === 'undefined') {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      // Try to parse as JSON
      const data = JSON.parse(text);
      console.error('Error response body (JSON):', data);
      throw new Error(data.message || `${res.status}: ${res.statusText}`);
    } catch (e) {
      // If JSON parsing fails, fall back to text
      console.error('JSON parse error:', e);
      if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
        throw e;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data);
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`API Response status: ${res.status}`);
    await throwIfResNotOk(res);
    
    // Clone the response to safely check content
    const clonedRes = res.clone();
    const text = await clonedRes.text();
    
    if (!text || text.trim() === '') {
      console.log(`Empty response for ${method} ${url}`);
      // For 204 No Content responses, return the original response
      if (res.status === 204) {
        return res;
      }
      // Return a response with null body for other empty responses
      return new Response('null', {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers
      });
    }
    
    return res;
  } catch (error) {
    console.error(`API Request Error: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Query function called with key:`, queryKey);
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      console.log(`Query response status: ${res.status} for ${queryKey[0]}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`401 handled as returnNull for ${queryKey[0]}`);
        return null;
      }

      await throwIfResNotOk(res);
      
      // Check if response has content before trying to parse JSON
      const text = await res.text();
      if (!text || text.trim() === '') {
        console.log(`Empty response for ${queryKey[0]}`);
        return null;
      }
      
      try {
        const data = JSON.parse(text);
        console.log(`Query data received for ${queryKey[0]}:`, data);
        return data;
      } catch (error) {
        console.error(`JSON parse error for ${queryKey[0]}:`, error);
        console.error(`Response text:`, text);
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } catch (error) {
      console.error(`Query error for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
