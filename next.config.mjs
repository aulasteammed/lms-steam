/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'utfs.io',
            },
        ],
    },
    // La sección se llamaba /proyectos: los enlaces viejos siguen funcionando.
    async redirects() {
        return [
            { source: '/proyectos', destination: '/trayectoria', permanent: true },
            { source: '/proyectos/:path*', destination: '/trayectoria/:path*', permanent: true },
            { source: '/teacher/proyectos', destination: '/teacher/trayectoria', permanent: true },
            { source: '/teacher/proyectos/:path*', destination: '/teacher/trayectoria/:path*', permanent: true },
        ];
    },
};

export default nextConfig;
