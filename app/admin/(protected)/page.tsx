import Link from "next/link";
import { db } from "@/prisma/db";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminPage() {
    const user = await requireAdmin();

    const [dosen, staff, berita, kurikulum, auditLogs, adminUsers] =
        await Promise.all([
            db.orm.public.Dosen.all(),
            db.orm.public.Staff.all(),
            db.orm.public.Berita.all(),
            db.orm.public.Kurikulum.all(),
            db.orm.public.AuditLog.all(),
            db.orm.public.AdminUser.all(),
        ]);

    const recentActivity = auditLogs
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
        .slice(0, 5)
        .map((log) => ({
            ...log,
            userName:
                adminUsers.find((user) => user.id === log.userId)?.nama ??
                "Admin",
        }));

    const stats = [
        {
            label: "Dosen",
            value: dosen.length,
            href: "/admin/dosen",
        },
        {
            label: "Staff",
            value: staff.length,
            href: "/admin/staff",
        },
        {
            label: "Berita",
            value: berita.length,
            href: "/admin/berita",
        },
    ];

    const management = [
        {
            label: "Mata Kuliah",
            description: "Kelola kurikulum dan mata kuliah.",
            href: "/admin/kurikulum",
        },
        {
            label: "Profil Prodi",
            description: "Kelola informasi utama program studi.",
            href: "/admin/profil",
        },
        {
            label: "Kalender Akademik",
            description: "Kelola agenda dan periode akademik.",
            href: "/admin/kalender-akademik",
        },
    ];

    return (
        <div className="space-y-8">
            <section>
                <h1 className="text-2xl font-bold text-slate-900">
                    Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Selamat datang, {user.nama}.
                </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow"
                    >
                        <p className="text-sm font-medium text-slate-500">
                            {stat.label}
                        </p>

                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {stat.value}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                            Kelola →
                        </p>
                    </Link>
                ))}
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Manajemen
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Akses cepat ke bagian utama administrasi.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {management.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow"
                        >
                            <h3 className="font-semibold text-slate-900">
                                {item.label}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                {item.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="font-semibold text-slate-900">
                        Informasi Akademik
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Kelola informasi perkuliahan, KRS, ujian, dan informasi
                        akademik lainnya.
                    </p>

                    <Link
                        href="/admin/informasi-akademik"
                        className="mt-4 inline-block text-sm font-medium text-blue-700 hover:text-blue-800"
                    >
                        Kelola informasi →
                    </Link>
                </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <h2 className="font-semibold text-slate-900">
                            Aktivitas Terbaru
                        </h2>

                        {recentActivity.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">
                                Belum ada aktivitas administrasi.
                            </p>
                        ) : (
                            <div className="mt-4 divide-y divide-slate-100">
                                {recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800">
                                                    {activity.action} {activity.entity}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {activity.details}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {activity.userName}
                                                </p>
                                            </div>

                                            <time
                                                dateTime={activity.createdAt}
                                                className="shrink-0 text-xs text-slate-400"
                                            >
                                                {new Date(activity.createdAt).toLocaleString(
                                                    "id-ID",
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    },
                                                )}
                                            </time>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
            </section>
        </div>
    );
}