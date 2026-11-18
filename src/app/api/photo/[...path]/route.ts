import { readPhoto } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const pathname = path.join("/");
  const photo = await readPhoto(pathname);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(photo.body as BodyInit, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
