import { auth } from '@clerk/nextjs/server';
import { CheckCircle, Clock, LogIn, CircleUserRound } from 'lucide-react';
import { getDashboardCourses } from '@/actions/get-dashboard-courses';
import { getHomeData } from '@/actions/get-home-data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CarouselHome } from './_components/carousel';
import { Course, Event, Article } from '@prisma/client';



interface HomeDataProps {
    closestEvent: Event | null;
    latestCourse: Course | null;
    latestArticle: Article | null;
}

interface CardProps {
    title: string;
    description: string;
    href?: string;
    color?: "blue" | "green" | "orange";
}


const truncate = (text: string, max = 90) =>
    text.length > max ? text.substring(0, max) + "..." : text;



const Banner = () => (
    <div className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-1 px-4">
        <p className="mt-2 text-sm md:text-base">
            Horario de atención: 8:00 A. M. - 12:00 M. y 1:00 - 5:00 P. M. | Bloque M3 - 119 |
            <span>
                <a className="text-orange-300" href="mailto:aula_steam_med@unal.edu.co">
                    {" "}aula_steam_med@unal.edu.co
                </a>
            </span>
        </p>
    </div>
);


const InteractiveCard = ({ title, description, href, color = "blue" }: CardProps) => {

    const colorStyles = {
        blue: "hover:border-blue-400",
        green: "hover:border-green-400",
        orange: "hover:border-orange-400",
    };

    const content = (
        <div
            className={` group bg-white text-black p-6 rounded-xl shadow-lg border transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.03] hover:bg-gray-50 cursor-pointer
                
            min-h-[190px] flex flex-col justify-between  
            ${colorStyles[color]}
        `}
        >
            <div>
                <h3 className="text-lg font-bold line-clamp-1">
                    {title}
                </h3>

                
                <p className="text-gray-600 mt-3 italic text-sm overflow-hidden">
                    {description}
                </p>
            </div>


            <div className="flex justify-end mt-4">
                <span className="text-sm text-gray-500 font-medium opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Descubrir
                </span>
            </div>

        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
};

const CardSkeleton = () => (
    <div className="bg-gray-200 p-6 rounded-lg shadow-lg h-[120px] animate-pulse" />
);



const HomeHighlights = ({
    closestEvent,
    latestCourse,
    latestArticle,
    isLoading = false,
}: HomeDataProps & { isLoading?: boolean }) => {

    if (isLoading) {
        return (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-5xl">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    return (
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-5xl">

            {/* Curso */}
            <InteractiveCard
                title="📚 Curso en línea"
                description={
                    latestCourse?.description
                        ? truncate(latestCourse.description)
                        : latestCourse?.title || "Aprende nuevas habilidades"
                }
                href={latestCourse ? `/courses/${latestCourse.id}` : "/courses"}
                color="green"
            />

            {/* Evento */}
            <InteractiveCard
                title="📅 Eventos"
                description={
                    closestEvent?.description
                        ? truncate(closestEvent.description)
                        : closestEvent?.title || "Participa en nuestros eventos"
                }
                href="/feed"
                color="blue"
            />

            {/* Artículo */}
            <InteractiveCard
                title="📰 Artículo"
                description={
                    latestArticle?.hookPhrase
                        ? truncate(latestArticle.hookPhrase)
                        : latestArticle?.title || "Descubre nuestras novedades"
                }
                href={latestArticle ? `/blog/${latestArticle.slug}` : "/blog"}
                color="orange"
            />

        </div>
    );
};



const Footer = () => (
    <footer className="mt-16 py-6 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Plataforma Aula STEAM.</p>
    </footer>
);



export default async function Dashboard() {
    const { userId } = await auth();
    const { closestEvent, latestCourse, latestArticle } = await getHomeData();

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-white">
            <CarouselHome />
            <Banner />

            {userId ? (
                <AuthenticatedDashboard
                    userId={userId}
                    closestEvent={closestEvent}
                    latestCourse={latestCourse}
                    latestArticle={latestArticle}
                />
            ) : (
                <PublicDashboard
                    closestEvent={closestEvent}
                    latestCourse={latestCourse}
                    latestArticle={latestArticle}
                />
            )}

            <Footer />
        </div>
    );
}

const AuthenticatedDashboard = async ({
    userId,
    closestEvent,
    latestCourse,
    latestArticle
}: {
    userId: string;
} & HomeDataProps) => {

    const { completedCourses, coursesInProgress } = await getDashboardCourses(userId);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-12">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6x1 mx-auto">

                <div className="flex flex-col gap-4 max-w-sm w-full mx-auto">
                    <h3 className="text-2xl font-bold mb-4 text-center">
                        Tus cursos
                    </h3>

                    <div className="grid grid-cols-2 gap-4">

                        <Link href="/mycourses">
                            <div className="
                                group
                                bg-blue-50 p-5 rounded-xl border shadow-sm
                                hover:shadow-md transition cursor-pointer
                            ">
                                <Clock className="w-6 h-6 text-blue-500 mb-2" />

                                <p className="text-sm text-gray-500">
                                    En progreso
                                </p>

                                <p className="text-2xl font-bold">
                                    {coursesInProgress.length}
                                </p>

                                <span className="
                                    text-xs text-gray-400 mt-2 block
                                    opacity-0 group-hover:opacity-100 transition
                                ">
                                    Ver cursos 
                                </span>
                            </div>
                        </Link>

                        <Link href="/mycourses">
                            <div className="
                                group
                                bg-green-50 p-5 rounded-xl border shadow-sm
                                hover:shadow-md transition cursor-pointer
                            ">
                                <CheckCircle className="w-6 h-6 text-green-500 mb-2" />

                                <p className="text-sm text-gray-500">
                                    Finalizados
                                </p>

                                <p className="text-2xl font-bold">
                                    {completedCourses.length}
                                </p>

                                <span className="
                                    text-xs text-gray-400 mt-2 block
                                    opacity-0 group-hover:opacity-100 transition
                                ">
                                    Ver cursos 
                                </span>
                            </div>
                        </Link>

                    </div>
                </div>

               
                <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-center">
                        Últimas novedades
                    </h3>

                    <HomeHighlights
                        closestEvent={closestEvent}
                        latestCourse={latestCourse}
                        latestArticle={latestArticle}
                    />
                </div>

            </div>
        </div>
    );
};



const PublicDashboard = ({
    closestEvent,
    latestCourse,
    latestArticle
}: HomeDataProps) => (
    <>
        <div className="text-center space-y-6 px-6 mt-6">
            <h1 className="text-4xl md:text-6xl font-extrabold">
                Explora, Aprende y Participa 🚀
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Accede a cursos, eventos y novedades tecnológicas en un solo lugar.
            </p>

            <div className="space-x-4">
                <Link href="/sign-up">
                    <Button size="sm" variant="outline">
                        <CircleUserRound className="h-4 w-4 mr-2 text-blue-500" />
                        Regístrate Gratis
                    </Button>
                </Link>

                <Link href="/sign-in">
                    <Button size="sm" variant="outline">
                        <LogIn className="h-4 w-4 mr-2 text-green-500" />
                        Iniciar sesión
                    </Button>
                </Link>
            </div>
        </div>

        {/* 🔥 Título */}
        <div className="mt-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold relative inline-block">
                Últimas novedades
                <span className="block h-1 bg-blue-400 mt-2 rounded-full"></span>
            </h2>
        </div>

        <HomeHighlights
            closestEvent={closestEvent}
            latestCourse={latestCourse}
            latestArticle={latestArticle}
        />
    </>
);