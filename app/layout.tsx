import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "PenPerfect: Elevate Your Writing, One Edit at a Time",
	description: "PenPerfect is an AI-powered text editing platform that refines and enhances your writing. Perfect your prose, elevate your essays, and create masterpieces with ease. Try PenPerfect now for flawless writing.",
	metadataBase: new URL("https://penperfect.llego.dev"),
	twitter: {
		card: "summary_large_image",
	},
};

export const viewport: Viewport = {
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${GeistSans.variable} ${GeistMono.variable} font-sans bg-gray-50 dark:bg-gray-950 text-black dark:text-white flex flex-col items-center px-3 py-10 min-h-dvh`}
			>
				<Toaster richColors theme="system" />

				<h1 className="font-semibold text-xl flex items-center justify-center">

					<span className="bg-gradient-to-b dark:from-gray-50 dark:to-gray-200 from-gray-950 to-gray-800 bg-clip-text text-transparent ml-3">
						PenPerfect
					</span>
				</h1>

				<p className="mt-3 text-center font-mono">
					Elevate Your{" "}
					<strong className="bg-yellow-200 text-black dark:bg-yellow-300 rounded">
						&lt;Writing&gt;
					</strong>
					, One Edit at a Time
				</p>

				{children}

				<footer className="text-center text-sm dark:text-gray-400 text-gray-600 font-mono">
					<p>
						<A href="https://github.com/llegomark/penperfect" target="_blank" rel="noopener noreferrer">github</A> |{" "}
						<A href="https://llego.dev" target="_blank" rel="noopener noreferrer">llego.dev</A> |{" "}
						<A href="https://docs.anthropic.com/claude/docs/models-overview" target="_blank" rel="noopener noreferrer">claude-3-haiku-20240307</A>
					</p>
					<p>
						crafted with ☕ in antipolo city
					</p>
				</footer>
			</body>
		</html>
	);
}

function A(props: any) {
	return (
		<a {...props} className="text-black dark:text-white hover:underline" />
	);
}