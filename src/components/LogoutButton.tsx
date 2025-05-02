// src/components/LogoutButton.tsx
'use client'; // Эта кнопка использует форму, но сама по себе проста

import { logoutAction } from "@/lib/authActions";

export default function LogoutButton() {
    return (
        <form action={logoutAction}>
            <button
                type="submit"
                className="text-sm font-medium text-gray-700 hover:text-red-600"
            >
                Logout
            </button>
        </form>
    );
}