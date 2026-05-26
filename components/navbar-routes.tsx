'use client';

import { UserButton, useAuth } from '@clerk/nextjs';
import { LogIn, UserRoundCog, UserRound, Home, Package, ClipboardList, PackageCheck, CircleUserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { SearchInput } from './search-input';
import { isTeacher } from '@/lib/teacher';

export const NavbarRoutes = () => {
    const { userId, isLoaded } = useAuth();
    const pathname = usePathname();

    if (!isLoaded) {
        return null;
    }

    const isTeacherPage = pathname?.startsWith('/teacher');
    const isCoursePage = pathname?.includes('/course');
    const isSearchPage = pathname === '/search';

    return (
        <>
            {isSearchPage && (
                <div className="hidden md:block">
                    <SearchInput />
                </div>
            )}

            {/* Links a páginas externas*/}
            {isTeacherPage && (
                <div className='flex gap-2'>
                    {/* Inventario*/}
                    <Link href='https://aula-steam.pages.dev/inventario/' target='_blank'>
                        <Button size="sm" variant="outline">
                            <Package className="h-4 w-4 mr-2 text-orange-500" />
                            Inventario
                        </Button>
                    </Link>

                    {/* Prestamos */}
                    <Link href='https://aula-steam.pages.dev/prestamos/' target='_blank'>
                        <Button size="sm" variant="outline">
                            <PackageCheck className="h-4 w-4 mr-2 text-orange-500" />
                            Préstamos
                        </Button>
                    </Link>

                    {/* Asistencia*/}
                    <Link href='https://asistencias-web-aula.vercel.app/admin.html' target='_blank'>
                        <Button size="sm" variant="outline">
                            <ClipboardList className="h-4 w-4 mr-2 text-orange-500" />
                            Asistencia
                        </Button>
                    </Link>
                </div>
            )}

            <div className="flex gap-4 items-center ml-auto">
                {userId ? (
                    isTeacherPage ? (
                        // Volver a modo estudiante
                        <Link href="/">
                            <Button size="sm" variant="outline">
                                <UserRound className="h-4 w-4 mr-2 text-blue-500" />
                                Modo Estudiante
                            </Button>
                        </Link>
                    ) : isCoursePage ? (
                        // Volver al inicio desde curso
                        <Link href="/">
                            <Button size="sm" variant="outline">
                                <Home className="h-4 w-4 mr-2 text-blue-500" />
                                Volver al inicio
                            </Button>
                        </Link>
                    ) : isTeacher(userId) ? (
                        // Ir a modo profesor
                        <Link href="/teacher/feed">
                            <Button size="sm" variant="outline">
                                <UserRoundCog className="h-4 w-4 mr-2 text-green-500" />
                                Modo Profesor
                            </Button>
                        </Link>
                    ) : null
                ) : (
                    // Usuario no autenticado
                    <>
                        <Link href="/sign-up">
                            <Button size="sm" variant="outline">
                                <CircleUserRound className="h-4 w-4 mr-2 text-blue-500" />
                                Registrarse
                            </Button>
                        </Link>
                        <Link href="/sign-in">
                            <Button size="sm" variant="outline">
                                <LogIn className="h-4 w-4 mr-2 text-green-500" />
                                Iniciar sesión
                            </Button>
                        </Link>
                    </>
                )}

                <UserButton afterSwitchSessionUrl="/" />
            </div>
        </>
    );
};
