"use server";

import { getServerSession } from "next-auth";
import { sendRequest } from "../api";
import { authOptions } from "@/app/api/auth/auth.options";
import { revalidateTag } from "next/cache";

export const handleLikeTrackAction = async (
  id: string | undefined,
  quantity: number
) => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  if (!id) {
    return {
      ok: false,
      message: "Track not found.",
    };
  }

  if (!accessToken) {
    return {
      ok: false,
      message: "Please login first.",
    };
  }

  const action = quantity > 0 ? "like" : "dislike";

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/${id}/${action}`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  revalidateTag("track-by-id");
  revalidateTag("liked-by-user");

  return {
    ok: !!res?.data || res?.statusCode === 200 || res?.statusCode === 201,
    message: res?.message,
  };
};
