import Link from "next/link";
import Image from "next/image";

const navItems = [
  { label: "HOME", href: "#" },
  { label: "PROJECTS", href: "#",},
  { label: "ABOUT", href: "#" },
];

export default function Header() {
    return (
        <header className="header bg-transparent fixed top-0 left-0 w-full z-10  border-b-[.7px] border-neutral600/10">
            <div className="container pt-8 pb-4 px-20 flex justify-between items-center">
                <Link href="/">
                    <Image
                        src="/logo_ignaite.svg"
                        alt="Logo"
                        width={136}
                        height={16}
                    />
                </Link>
                <nav>
                    <ul className="flex gap-8">
                        {navItems.map((item) => (
                            <li key={item.label} className="py-4 px-6">
                                <Link
                                    href={item.href}
                                    className="text-neutral600 hover:text-primary transition-colors duration-300"
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    );
}