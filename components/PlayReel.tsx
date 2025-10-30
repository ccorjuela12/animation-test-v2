import { PlayReelProps } from "@/types/types";

export default function PlayReel({text, numberIcons, repeat}:PlayReelProps){
    return (
        <div className="flex justify-around">
            {Array.from({ length: repeat }).map((_, index) => (
                <div className="flex gap-4 items-center" key={index}>
                <p>{text}</p>
                <div className="flex gap-2">
                    {Array.from({ length: numberIcons }).map((_, index) => (
                    <svg key={index} xmlns="http://www.w3.org/2000/svg" width="11" height="13" viewBox="0 0 11 13" fill="none">
                        <path d="M10.1887 5.0002C10.9937 5.46499 10.9937 6.62697 10.1887 7.09176L1.81122 11.9285C1.00618 12.3933 -0.000118857 11.8123 -0.000118817 10.8827L-0.000118394 1.20926C-0.000118353 0.279682 1.00618 -0.301307 1.81122 0.163483L10.1887 5.0002Z" fill="white"/>
                    </svg>
                    ))}
                </div>
                </div>
            ))}
          </div>
    );

}