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

        let password= "";

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

const email = await rl.question("Email: ");
rl.close();

const password= await readPassword();

const users = await db.orm.public.AdminUser.all();
const user = users.find((item) => item.email === email);

if (!user) {
    console.log("Akun tidak ditemukan.");
    process.exit(1);
}

const valid = await argon2.verify(user.passwordHash, password);

if (valid) {
    console.log("Password BENAR.");
} else {
    console.log("Password SALAH.");
}