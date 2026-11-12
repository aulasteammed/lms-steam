import { auth } from '@clerk/nextjs/server';
import { ArrowUpRight, CheckCircle, ClipboardCheck, Clock, Layers3, LogIn, CircleUserRound } from 'lucide-react';
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
    // Los dos colores del identificador del Aula: azul de fondo y el correo en naranja.
    <div className="w-full bg-editorial-identity text-white text-center py-2.5 px-4">
        <p className="text-sm md:text-base">
            Horario de atención: 8:00 A. M. - 12:00 M. y 1:00 - 5:00 P. M. | Bloque M3 - 119 |
            <span>
                <a
                    className="text-editorial-identity-orange underline decoration-editorial-identity-orange/50 underline-offset-4 hover:decoration-editorial-identity-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
                    href="mailto:aula_steam_med@unal.edu.co"
                >
                    {" "}aula_steam_med@unal.edu.co
                </a>
            </span>
        </p>
    </div>
);


/**
 * Servicios del aula, visibles para todos en el inicio. Son dos cosas de
 * distinta naturaleza y por eso se muestran distinto:
 * - El protocolo de uso es una norma: se lee antes de venir.
 * - La impresión 3D es un trámite: tiene pasos y termina en un formulario.
 */
const LINKS = {
    roomProtocol: "https://drive.google.com/file/d/18kGWk8PDbAggv8_WgjHXAn3QSeaQv7Iw/view",
    printGuide: "https://drive.google.com/file/d/1jR-W-020pH57sdDuqaDmNQpiVzHHLCqt/view",
    /** Formulario de solicitud; también está en la guía (PDF). */
    printForm: "https://forms.gle/icnQhctzt5rzAUnC8",
};

const PRINT_STEPS = [
    "Revisa los criterios de solicitud en la guía.",
    "Diligencia el formulario de solicitud con la información requerida.",
    "El equipo del aula revisa y te confirma por correo si fue aprobada la solicitud.",
];

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-identity focus-visible:ring-offset-2";

/**
 * Enlace a un documento externo: subrayado siempre, no solo al pasar el cursor.
 * El texto va en el azul del identificador en los dos bloques; el subrayado
 * toma el tono del bloque (`decoration`).
 */
const DocLink = ({
    href,
    decoration,
    children,
}: {
    href: string;
    decoration: string;
    children: React.ReactNode;
}) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex min-h-11 items-center gap-1 rounded-sm text-sm font-medium text-editorial-identity underline underline-offset-4 transition hover:decoration-editorial-identity ${decoration} ${focusRing}`}
    >
        {children}
        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="sr-only">(se abre en una pestaña nueva)</span>
    </a>
);

const AulaServices = ({ className = "" }: { className?: string }) => (
    <section aria-label="Servicios del aula" className={`w-full px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="max-w-5xl mx-auto grid gap-4 lg:grid-cols-[2fr_3fr]">
            {/* Norma: se lee antes de venir. Azul del identificador, como el horario. */}
            <div className="flex flex-col rounded-xl bg-editorial-identity-soft p-5">
                <div className="flex items-center gap-2.5">
                    <ClipboardCheck className="h-5 w-5 shrink-0 text-editorial-identity" aria-hidden />
                    <h2 className="text-base font-semibold text-editorial-identity">¿Vas a usar el aula?</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    Conoce los acuerdos para el cuidado del espacio, el préstamo de equipos y el manejo
                    de materiales.
                </p>
                <div className="mt-auto pt-2">
                    <DocLink href={LINKS.roomProtocol} decoration="decoration-editorial-identity/30">
                        Leer protocolo de uso del aula (PDF)
                    </DocLink>
                </div>
            </div>

            {/* Trámite: pasos y una acción principal. Naranja del identificador. */}
            <div className="rounded-xl bg-editorial-identity-orange-soft p-5">
                <div className="flex items-start gap-2.5">
                    <Layers3 className="mt-0.5 h-5 w-5 shrink-0 text-editorial-identity" aria-hidden />
                    <h2 className="text-base font-semibold text-editorial-identity">
                        ¿Necesitas imprimir una pieza en 3D?
                    </h2>
                </div>
                <ol className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-4">
                    {PRINT_STEPS.map((step, i) => (
                        <li key={step} className="flex items-start gap-2.5 text-sm leading-snug text-gray-700">
                            <span
                                aria-hidden
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-editorial-identity-orange text-xs font-bold tabular-nums text-editorial-identity"
                            >
                                {i + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                        </li>
                    ))}
                </ol>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <DocLink href={LINKS.printGuide} decoration="decoration-editorial-identity-orange">
                        Ver criterios y paso a paso (PDF)
                    </DocLink>                  
                  
                    <a
                        href={LINKS.printForm}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex h-11 items-center gap-2 rounded-lg bg-editorial-identity-orange px-5 text-sm font-semibold text-editorial-identity shadow-sm transition hover:bg-editorial-identity-orange-hover ${focusRing}`}
                    >

                        Solicitar impresión 3D
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                        <span className="sr-only">(formulario, se abre en una pestaña nueva)</span>
                    </a>

                </div>
            </div>
        </div>
    </section>
);


const InteractiveCard =({ title, description, href, color = "blue" }: CardProps) => {

    const colorStyles = {
        // Azul y naranja del identificador; el verde de cursos se mantiene.
        blue: "hover:border-editorial-identity",
        green: "hover:border-green-400",
        orange: "hover:border-editorial-identity-orange",
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

            {/* Sin sesión, los servicios van después de la bienvenida (PublicDashboard);
                con sesión no hay bienvenida, así que van arriba. */}
            {userId ? (
                <>
                <AulaServices className="mt-6" />
                <AuthenticatedDashboard
                    userId={userId}
                    closestEvent={closestEvent}
                    latestCourse={latestCourse}
                    latestArticle={latestArticle}
                />
                </>
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

        <AulaServices className="mt-10" />

        {/* 🔥 Título */}
        <div className="mt-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold relative inline-block">
                Últimas novedades
                {/* Naranja del identificador, como el botón de impresión 3D */}
                <span className="block h-1 bg-editorial-identity-orange mt-2 rounded-full"></span>
            </h2>
        </div>

        <HomeHighlights
            closestEvent={closestEvent}
            latestCourse={latestCourse}
            latestArticle={latestArticle}
        />
    </>
);