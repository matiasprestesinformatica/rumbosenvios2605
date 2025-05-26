import type { SVGProps } from 'react';

export function RumbosEnviosLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="120"
      height="30"
      aria-label="Rumbos Envios Logo"
      {...props}
    >
      <rect width="200" height="50" fill="none" />
      <text
        x="10"
        y="35"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="hsl(var(--primary))"
      >
        Rumbos
      </text>
      <text
        x="105"
        y="35"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize="30"
        fill="hsl(var(--foreground))"
      >
        Envios
      </text>
       <path d="M185 15 L195 25 L185 35" strokeWidth="2" stroke="hsl(var(--accent))" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
