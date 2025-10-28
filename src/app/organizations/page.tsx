
"use client";
import Link from 'next/link';

export default function TeamsRedirectPage() {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center text-center p-4">
            <h1 className="text-2xl font-bold mb-4">Please select a company</h1>
            <p className="text-muted-foreground mb-6">
                To view teams, you must first select a company from the homepage.
            </p>
            <Link href="/" className="text-primary hover:underline">
                Go to Homepage
            </Link>
        </div>
    );
}
