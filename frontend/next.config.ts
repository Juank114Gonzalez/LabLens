import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async redirects() {
    return [
      {
        // Crear una evaluación dejó de ser una página propia: ahora es un
        // diálogo dentro de Evaluaciones. Se redirige aquí, en la capa de
        // rutas, para que sea una redirección HTTP real — hacerlo desde la
        // página deja que el layout empiece a renderizar y produce un parpadeo.
        source: '/chat/new',
        destination: '/evaluations',
        // Temporal a propósito: un 308 se cachea en el navegador y sería un
        // estorbo si algún día la ruta vuelve.
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
