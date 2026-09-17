interface Impresora3DProps {
    className?: string;
}

export const Impresora3D = ({ className }: Impresora3DProps) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Cabezal extrusor: se desplaza de lado a lado imitando la impresión */}
            <g className="animate-print-head" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cx="12" cy="3" r="1" />
                <path d="M12 4 L8.5 9 L15.5 9 Z" />
            </g>

            {/* Estructura / marco de la impresora */}
            <line x1="8.5" y1="9" x2="8.5" y2="19" />
            <line x1="15.5" y1="9" x2="15.5" y2="19" />
            <line x1="6" y1="19" x2="18" y2="19" />

            {/* Pieza siendo impresa: crece en capas dentro de la cama */}
            <rect
                x="10"
                y="14"
                width="4"
                height="4"
                rx="0.5"
                className="animate-print-layer"
                style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
            />
        </svg>
    );
};
