import queryString from "query-string";
import slugify from "slugify";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const AUTH_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth`;

const buildUrl = (path: string) => {
  if (!path) return "";

  if (path.startsWith("http")) {
    return path;
  }

  // API local của Next.js
  if (path.startsWith("/api/revalidate")) {
    return path;
  }

  // API backend Spring Boot
  if (path.startsWith("/")) {
    return `${BACKEND_URL}${path}`;
  }

  return `${BACKEND_URL}/${path}`;
};

const buildQueryUrl = (url: string, queryParams?: Record<string, any>) => {
  if (!queryParams || Object.keys(queryParams).length === 0) return url;

  const query = queryString.stringify(queryParams, {
    skipNull: true,
    skipEmptyString: true,
  });

  if (!query) return url;

  return `${url}?${query}`;
};

const authHeaders = (accessToken?: string) => {
  if (!accessToken) return {};

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

export const getTrackId = (track?: any) => {
  return track?._id || track?.id || "";
};

export const getUserId = (user?: any) => {
  return user?._id || user?.id || "";
};

export const getImageUrl = (imgUrl?: string | null) => {
  if (!imgUrl) return "/images/logo/Sc.png";

  if (imgUrl.startsWith("http")) {
    return imgUrl;
  }

  if (imgUrl.startsWith("/uploads/images")) {
    return `${BACKEND_URL}${imgUrl}`;
  }

  if (imgUrl.startsWith("/")) {
    return imgUrl;
  }

  return `${BACKEND_URL}/uploads/images/${imgUrl}`;
};

export const getAudioUrl = (trackUrl?: string | null) => {
  if (!trackUrl) return "";

  if (trackUrl.startsWith("http")) {
    return trackUrl;
  }

  if (trackUrl.startsWith("/uploads/audio")) {
    return `${BACKEND_URL}${trackUrl}`;
  }

  if (trackUrl.startsWith("/")) {
    return `${BACKEND_URL}${trackUrl}`;
  }

  return `${BACKEND_URL}/uploads/audio/${trackUrl}`;
};

export const getAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return "";

  if (avatar.startsWith("http")) {
    return avatar;
  }

  if (avatar.startsWith("/uploads/images")) {
    return `${BACKEND_URL}${avatar}`;
  }

  if (avatar.startsWith("/")) {
    return avatar;
  }

  return `${BACKEND_URL}/uploads/images/${avatar}`;
};

export const normalizeTrack = <T extends any>(track?: T | null): T | null => {
  if (!track) return null;

  const id = getTrackId(track);

  return {
    ...track,
    _id: id,
    id,
    imgUrl: (track as any).imgUrl,
    trackUrl: (track as any).trackUrl,
  };
};

export const sendRequest = async <T>(props: IRequest) => {
  let {
    url,
    method,
    body,
    queryParams = {},
    useCredentials = false,
    headers = {},
    nextOption = {},
  } = props;

  url = buildQueryUrl(url, queryParams);

  const options: any = {
    method,
    headers: new Headers({
      "content-type": "application/json",
      ...headers,
    }),
    body: body ? JSON.stringify(body) : null,
    ...nextOption,
  };

  if (useCredentials) {
    options.credentials = "include";
  }

  return fetch(url, options).then((res) => {
    if (res.ok) {
      return res.json() as T;
    }

    return res.json().then((json) => {
      return {
        statusCode: res.status,
        message: json?.message ?? "",
        error: json?.error ?? "",
      } as T;
    });
  });
};

export const sendRequestFile = async <T>(props: RequestFileProps) => {
  let {
    url,
    method,
    body,
    queryParams = {},
    useCredentials = false,
    headers = {},
    nextOption = {},
  } = props;

  url = buildQueryUrl(url, queryParams);

  const options: any = {
    method,
    headers: new Headers({
      ...headers,
    }),
    body: body || null,
    ...nextOption,
  };

  if (useCredentials) {
    options.credentials = "include";
  }

  return fetch(url, options).then((res) => {
    if (res.ok) {
      return res.json() as T;
    }

    return res.json().then((json) => {
      return {
        statusCode: res.status,
        message: json?.message ?? "",
        error: json?.error ?? "",
      } as T;
    });
  });
};

export const convertSlugUrl = (str: string) => {
  if (!str) return "";

  return slugify(str, {
    lower: true,
    locale: "vi",
    strict: true,
  });
};

/* =========================
   AUTH APIs
========================= */

export const loginAPI = async (payload: LoginPayload) => {
  return await sendRequest<IBackendRes<AuthUserResponse>>({
    url: `${AUTH_URL}/login`,
    method: "POST",
    body: payload,
  });
};

export const getAccountApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IUser>>({
    url: buildUrl("/api/v1/auth/account"),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const refreshTokenApi = (refresh_token: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/v1/auth/refresh"),
    method: "POST",
    body: {
      refresh_token,
    },
  });
};

export const logoutApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/v1/auth/logout"),
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const socialMediaLoginApi = (
  payload:
    | {
        type: string;
        email?: string | null;
        username?: string | null;
        name?: string | null;
        avatarUrl?: string | null;
        image?: string | null;
      }
    | string,
  username?: string
) => {
  const body =
    typeof payload === "string"
      ? {
          type: payload,
          email: username,
          username,
        }
      : {
          ...payload,
          username: payload.username || payload.email,
          email: payload.email || payload.username,
        };

  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/v1/auth/social-media"),
    method: "POST",
    body,
  });
};

/* =========================
   USERS APIs
========================= */

export const getAllUsersApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IUser[]>>({
    url: buildUrl("/api/v1/users/all"),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const getUsersApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<IUser>>>({
    url: buildUrl("/api/v1/users"),
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const getUserByIdApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<IUser>>({
    url: buildUrl(`/api/v1/users/${id}`),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const createUserApi = (
  payload: CreateUserPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IUser>>({
    url: buildUrl("/api/v1/users"),
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const updateUserApi = (
  payload: UpdateUserPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IUser>>({
    url: buildUrl("/api/v1/users"),
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const deleteUserApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl(`/api/v1/users/${id}`),
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   TRACKS APIs
========================= */

export const getTracksApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<ITrackTop> | ITrackTop[]>>({
    url: buildUrl("/api/v1/tracks"),
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const getTrackByIdApi = (id: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: buildUrl(`/api/v1/tracks/${id}`),
    method: "GET",
  });
};

export const getTrackBySlugOrIdApi = (slugOrId: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: buildUrl(`/api/v1/tracks/${slugOrId}`),
    method: "GET",
  });
};

export const createTrackApi = (
  payload: CreateTrackPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: buildUrl("/api/v1/tracks"),
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const updateTrackApi = (
  id: string,
  payload: UpdateTrackPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: buildUrl(`/api/v1/tracks/${id}`),
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const deleteTrackApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl(`/api/v1/tracks/${id}`),
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

export const getTopTracksApi = (category: string, limit = 10) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: buildUrl("/api/v1/tracks/top"),
    method: "GET",
    queryParams: {
      category: category.toLowerCase(),
      limit,
    },
  });
};

export const getTrackCommentsApi = (trackId: string) => {
  return sendRequest<IBackendRes<ITrackComment[]>>({
    url: buildUrl(`/api/v1/tracks/${trackId}/comments`),
    method: "GET",
  });
};

export const getTracksByUserApi = (
  userId: string,
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<ITrackTop> | ITrackTop[]>>({
    url: buildUrl("/api/v1/tracks/users"),
    method: "POST",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    body: {
      id: userId,
    },
    headers: authHeaders(accessToken),
  });
};

export const increaseTrackViewApi = (trackId: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl(`/api/v1/tracks/${trackId}/play`),
    method: "POST",
  });
};

export const searchTracksApi = (keyword: string) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: buildUrl("/api/v1/tracks/search"),
    method: "GET",
    queryParams: {
      keyword,
    },
  });
};

/* =========================
   FILE UPLOAD APIs
========================= */

export const uploadFileApi = (
  file: File,
  targetType: FileTargetType,
  accessToken?: string
) => {
  const formData = new FormData();

  formData.append("fileUpload", file);

  return sendRequestFile<IBackendRes<IUploadFileResponse>>({
    url: buildUrl("/api/v1/files/upload"),
    method: "POST",
    body: formData,
    headers: {
      ...authHeaders(accessToken),
      target_type: targetType,
    },
  });
};

export const uploadImageApi = (file: File, accessToken?: string) => {
  return uploadFileApi(file, "images", accessToken);
};

export const uploadTrackFileApi = (file: File, accessToken?: string) => {
  return uploadFileApi(file, "tracks", accessToken);
};

/* =========================
   COMMENTS APIs
========================= */

export const getCommentsApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<ITrackComment>>>({
    url: buildUrl("/api/v1/comments"),
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const createCommentApi = (
  payload: CreateCommentPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ITrackComment>>({
    url: buildUrl("/api/v1/comments"),
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const createTrackCommentApi = (
  trackId: string,
  payload: CreateCommentPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ITrackComment>>({
    url: buildUrl(`/api/v1/tracks/${trackId}/comments`),
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const deleteCommentApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl(`/api/v1/comments/${id}`),
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   PLAYLISTS APIs
========================= */

export const createEmptyPlaylistApi = (
  payload: CreatePlaylistPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IPlaylist>>({
    url: buildUrl("/api/v1/playlists/empty"),
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const updatePlaylistApi = (
  payload: UpdatePlaylistPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IPlaylist>>({
    url: buildUrl("/api/v1/playlists"),
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const deletePlaylistApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl(`/api/v1/playlists/${id}`),
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

export const getPlaylistByIdApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<IPlaylist>>({
    url: buildUrl(`/api/v1/playlists/${id}`),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const getPlaylistsApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<IPlaylist> | IPlaylist[]>>({
    url: buildUrl("/api/v1/playlists"),
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const getPlaylistsByUserApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<IPlaylist> | IPlaylist[]>>({
    url: buildUrl("/api/v1/playlists/by-user"),
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 100,
    },
    headers: authHeaders(accessToken),
  });
};

/* =========================
   LIKES APIs
========================= */

export const likeTrackApi = (trackId: string, accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: buildUrl(`/api/v1/tracks/${trackId}/like`),
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const dislikeTrackApi = (trackId: string, accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: buildUrl(`/api/v1/tracks/${trackId}/dislike`),
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const getLikedTracksApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: buildUrl("/api/v1/tracks/liked"),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   NEXT REVALIDATE API
========================= */

export const revalidateApi = (tag: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/revalidate"),
    method: "POST",
    queryParams: {
      tag,
      secret: "justArandomString",
    },
  });
};

/* =========================
   LeaderBoard API
========================= */

export const getArtistLeaderboard = async (
  limit = 10
): Promise<ArtistLeaderboardItem[]> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/leaderboard/artists?limit=${limit}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch artist leaderboard");
  }

  const json = (await res.json()) as ArtistLeaderboardResponse;

  return Array.isArray(json?.data) ? json.data : [];
};

// ===================== CATEGORY API =====================

export const getCategoryId = (category?: ICategory | any) => {
  return category?._id || category?.id || "";
};

// GET /api/v1/categories?current=1&pageSize=100
export const getCategories = async (
  current = 1,
  pageSize = 100,
  accessToken?: string
) => {
  return await sendRequest<
    IBackendRes<IModelPaginate<ICategory> | ICategory[]>
  >({
    url: `${BACKEND_URL}/api/v1/categories`,
    method: "GET",
    queryParams: {
      current,
      pageSize,
    },
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
    nextOption: {
      cache: "no-store",
    },
  });
};

// GET /api/v1/categories/all
export const getAllCategories = async () => {
  return await sendRequest<IBackendRes<ICategory[]>>({
    url: `${BACKEND_URL}/api/v1/categories/all`,
    method: "GET",
  });
};

// GET /api/v1/categories/{id}
export const getCategoryById = async (id: string) => {
  return await sendRequest<IBackendRes<ICategory>>({
    url: `${BACKEND_URL}/api/v1/categories/${id}`,
    method: "GET",
  });
};

// GET /api/v1/categories/slug/{slug}
export const getCategoryBySlug = async (slug: string) => {
  return await sendRequest<IBackendRes<ICategory>>({
    url: `${BACKEND_URL}/api/v1/categories/slug/${slug}`,
    method: "GET",
  });
};

// POST /api/v1/categories
export const createCategory = async (
  data: ICreateCategory,
  accessToken?: string
) => {
  return await sendRequest<IBackendRes<ICategory>>({
    url: `${BACKEND_URL}/api/v1/categories`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: data,
  });
};

// PUT /api/v1/categories/{id}
export const updateCategory = async (
  id: string,
  data: IUpdateCategory,
  accessToken?: string
) => {
  return await sendRequest<IBackendRes<ICategory>>({
    url: `${BACKEND_URL}/api/v1/categories/${id}`,
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: data,
  });
};

// DELETE /api/v1/categories/{id}
export const deleteCategoryApi = async (id: string, accessToken?: string) => {
  return await sendRequest<IBackendRes<null>>({
    url: `${BACKEND_URL}/api/v1/categories/${id}`,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

// GET tracks theo category slug
// GET /api/v1/tracks/top?category=ncs
export const getTracksByCategory = async (categorySlug: string) => {
  return await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${BACKEND_URL}/api/v1/tracks/top`,
    method: "GET",
    queryParams: {
      category: categorySlug,
    },
  });
};

/// mail logic

export const registerApi = (payload: RegisterPayload) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/v1/auth/register"),
    method: "POST",
    body: payload,
  });
};

export const registerWithOtpAPI = async (payload: RegisterPayload) => {
  return await sendRequest<IBackendRes<IUser>>({
    url: `${AUTH_URL}/register`,
    method: "POST",
    body: payload,
  });
};

export const verifyRegisterOtpAPI = async (payload: VerifyOtpPayload) => {
  return await sendRequest<IBackendRes<IUser>>({
    url: `${AUTH_URL}/verify-otp`,
    method: "POST",
    body: payload,
  });
};

export const resendRegisterOtpAPI = async (email: string) => {
  return await sendRequest<IBackendRes<any>>({
    url: `${AUTH_URL}/resend-otp`,
    method: "POST",
    body: { email },
  });
};

export const forgotPasswordAPI = async (payload: ForgotPasswordPayload) => {
  return await sendRequest<IBackendRes<any>>({
    url: `${AUTH_URL}/forgot-password`,
    method: "POST",
    body: payload,
  });
};

export const resetPasswordAPI = async (payload: ResetPasswordPayload) => {
  return await sendRequest<IBackendRes<any>>({
    url: `${AUTH_URL}/reset-password`,
    method: "POST",
    body: payload,
  });
};

//// follower/ing api

export const followUserApi = (userId: string, accessToken?: string) => {
  return sendRequest<IBackendRes<IUser>>({
    url: buildUrl(`/api/v1/users/${userId}/follow`),
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const unfollowUserApi = (userId: string, accessToken?: string) => {
  return sendRequest<IBackendRes<IUser>>({
    url: buildUrl(`/api/v1/users/${userId}/unfollow`),
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const getMyFollowingApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<{ result: IUser[]; total: number }>>({
    url: buildUrl("/api/v1/users/me/following"),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const getMyFollowersApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<{ result: IUser[]; total: number }>>({
    url: buildUrl("/api/v1/users/me/followers"),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const getUserFollowingApi = (userId: string) => {
  return sendRequest<IBackendRes<{ result: IUser[]; total: number }>>({
    url: buildUrl(`/api/v1/users/${userId}/following`),
    method: "GET",
  });
};

export const getUserFollowersApi = (userId: string) => {
  return sendRequest<IBackendRes<{ result: IUser[]; total: number }>>({
    url: buildUrl(`/api/v1/users/${userId}/followers`),
    method: "GET",
  });
};

export const getFollowStatusApi = (userId: string, accessToken?: string) => {
  return sendRequest<IBackendRes<{ isFollowing: boolean }>>({
    url: buildUrl(`/api/v1/users/${userId}/follow-status`),
    method: "GET",
    headers: authHeaders(accessToken),
  });
};
