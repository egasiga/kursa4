import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Улучшенная функция для API-запросов, которая разрешает проблему с чтением body stream
 * @param method HTTP метод (GET, POST и т.д.)
 * @param url URL запроса
 * @param body Опциональное тело запроса (для POST, PUT и др.)
 * @returns Промис с результатом в формате JSON
 */
export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<any> {
  try {
    // Настраиваем параметры запроса
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: "include",
    };
    
    // Добавляем тело запроса для не-GET методов
    if (method !== 'GET' && body) {
      options.body = JSON.stringify(body);
    }
    
    // Выполняем запрос
    const res = await fetch(url, options);
    
    // Проверяем статус ответа
    await throwIfResNotOk(res);
    
    // Преобразуем ответ в JSON и возвращаем
    const jsonResult = await res.json();
    return jsonResult;
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
