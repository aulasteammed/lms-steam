import Image from "next/image";
import Link from "next/link";

export const Logo = () => {
  return (
    <Link href="/" aria-label="Ir al inicio">
      <Image
        height={130}
        width={180}
        alt="logo"
        src="/IdentificadorAulaSTEAM.png"
        priority
        className="cursor-pointer"
      />
    </Link>
  );
};
