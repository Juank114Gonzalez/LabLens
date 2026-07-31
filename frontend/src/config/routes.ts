export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  chatNew: '/chat/new',
  chat: (id: string) => `/chat/${id}`,
  evaluations: '/evaluations',
  evaluation: (id: string) => `/evaluations/${id}`,
} as const;
