import { requireSameOriginRequest } from "@/lib/http/origin";
import { deleteSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const originError = requireSameOriginRequest(request);
  if (originError) {
      return originError;
  }

  await deleteSession();

  return Response.json({
    message: "Logout berhasil",
  });
}