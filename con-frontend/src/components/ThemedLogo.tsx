import Image from "next/image";
const ThemedLogo = ({ className }: Props) => {
    return (
        <div className={`hover:scale-110 transition-all dark:brightness-0 dark:invert ${className}`}>
            <Image src="/logo.svg" alt="Logo" className="h-full w-full" width={100} height={100} />
        </div>
    );
}
interface Props {
    className?: string;
}

export default ThemedLogo;