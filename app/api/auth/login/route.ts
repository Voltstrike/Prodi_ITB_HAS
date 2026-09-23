import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/prisma/db";

export async function POST(request: Request) {
    const body = await request.json();

    const email = body.email?.toString().trim() ?? "";
    const password = body.password?.toString() ?? "";

    if (!email || !password) {
        return Response.json(
            { message: "Email dan password wajib diisi" },
            { status: 400 }
        );
    }

    const users = await db.orm.public.AdminUser.all();

    const user = users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
        return Response.json(
            { message: "Email atau password salah" },
            { status: 401 }
        );
    }

    const passwordValid = await verifyPassword(
        password,
        user.passwordHash
    );

    if (!passwordValid) {
        return Response.json(
            { message: "Email atau password salah" },
            { status: 401 }
        );
    }

    await createSession(user.id);

    return Response.json({
        message: "Login berhasil",
    });
}
