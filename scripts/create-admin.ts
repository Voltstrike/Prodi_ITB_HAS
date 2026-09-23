import "dotenv/config";
import argon2 from "argon2";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "../prisma/db";

function readPassword(): Promise<string> {
    return new Promise((resolve) => {
        process.stdout.write("Password: ");

        const stdin = process.stdin;

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");

        let password = "";

        function onData(char: string) {
            if (char === "\u0003") {
                stdin.setRawMode(false);
                stdin.pause();
                process.stdout.write("\n");
                process.exit(1);
            }

            if (char === "\r" || char === "\n") {
                stdin.setRawMode(false);
                stdin.pause();
                stdin.removeListener("data", onData);
                process.stdout.write("\n");
                resolve(password);
                return;
            }

            if (char === "\u007f") {
                if (password.length > 0) {
                    password = password.slice(0, -1);
                }
                return;
            }

            password += char;
        }

        stdin.on("data", onData);
    });
}

const rl = createInterface({ input, output });


    const nama = await rl.question("Nama staff: ");
    const email = await rl.question("Email staff: ");

    rl.close();

    const password = await readPassword();

    if (!nama || !email || !password) {
        throw new Error("Nama, email, dan password wajib diisi.");
    }

    const passwordHash = await argon2.hash(password);

    const user = await db.orm.public.AdminUser.create({
        nama,
        email,
        passwordHash,
        role: "ADMIN",
    });

    console.log(`Admin berhasil dibuat: ${user.email}`);

