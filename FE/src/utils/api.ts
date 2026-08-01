import queryString from "query-string";
import slugify from "slugify";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
  /\/+$/,
  ""
);

const AUTH_URL = `${BACKEND_URL}/api/v1/auth`;

type QueryParams = Record<string, unknown>;

const buildUrl = (path: string) => {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // API nội bộ của Next.js.
  if (path.startsWith("/api/revalidate")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${BACKEND_URL}${path}`;
  }

  return `${BACKEND_URL}/${path}`;
};

const buildQueryUrl = (url: string, queryParams?: QueryParams) => {
  const absoluteUrl = buildUrl(url);

  if (!queryParams || Object.keys(queryParams).length === 0) {
    return absoluteUrl;
  }

  const query = queryString.stringify(queryParams, {
    skipNull: true,
    skipEmptyString: true,
  });

  return query ? `${absoluteUrl}?${query}` : absoluteUrl;
};

const authHeaders = (accessToken?: string): Record<string, string> => {
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text ? { message: text } : null;
};

const createErrorResponse = <T>(response: Response, body: any): T => {
  return {
    statusCode: response.status,
    message:
      body?.message || body?.error || response.statusText || "Request failed",
    error: body?.error || response.statusText || "",
    data: null,
  } as T;
};

const toFormData = (payload: Record<string, any> | FormData): FormData => {
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    return payload;
  }

  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          formData.append(key, item instanceof Blob ? item : String(item));
        }
      });

      return;
    }

    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

const getResponseResult = <T>(response: any): T[] => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  return [];
};

const normalizeFollowResponse = (
  response: any
): IBackendRes<FollowStatusData> => {
  const rawData = response?.data || {};

  const following = Boolean(rawData.following ?? rawData.isFollowing ?? false);

  return {
    ...response,
    data: {
      ...rawData,
      following,
      isFollowing: following,
      targetFollowers: Number(rawData.targetFollowers) || 0,
      currentUserFollowing: Number(rawData.currentUserFollowing) || 0,
    },
  };
};

export const getTrackId = (track?: any) => {
  return track?.id || track?._id || "";
};

export const getUserId = (user?: any) => {
  return user?._id || user?.id || "";
};

export const getCategoryId = (category?: ICategory | any) => {
  return category?._id || category?.id || "";
};

export const getImageUrl = (imgUrl?: string | null) => {
  if (!imgUrl) return "/images/logo/Sc.png";

  if (/^https?:\/\//i.test(imgUrl)) {
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

  if (/^https?:\/\//i.test(trackUrl)) {
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

  if (/^https?:\/\//i.test(avatar)) {
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

  const id = String((track as any).id || (track as any)._id || "").trim();

  return {
    ...track,
    _id: id,
    id,
    imgUrl: (track as any).imgUrl,
    trackUrl: (track as any).trackUrl,
  };
};

export const sendRequest = async <T>(props: IRequest): Promise<T> => {
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

  const requestHeaders = new Headers({
    ...headers,
  });

  const hasBody =
    body !== undefined &&
    body !== null &&
    method !== "GET" &&
    method !== "HEAD";

  if (hasBody && !requestHeaders.has("content-type")) {
    requestHeaders.set("content-type", "application/json");
  }

  const options: RequestInit & Record<string, any> = {
    method,
    headers: requestHeaders,
    ...nextOption,
  };

  if (hasBody) {
    options.body = JSON.stringify(body);
  }

  if (useCredentials) {
    options.credentials = "include";
  }

  try {
    const response = await fetch(url, options);
    const responseBody = await parseResponseBody(response);

    if (response.ok) {
      return responseBody as T;
    }

    return createErrorResponse<T>(response, responseBody);
  } catch (error) {
    return {
      statusCode: 0,
      message: error instanceof Error ? error.message : "Network error",
      error: "NETWORK_ERROR",
      data: null,
    } as T;
  }
};

export const sendRequestFile = async <T>(
  props: RequestFileProps
): Promise<T> => {
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

  const options: RequestInit & Record<string, any> = {
    method,
    headers: new Headers({
      ...headers,
    }),
    body: body || undefined,
    ...nextOption,
  };

  if (useCredentials) {
    options.credentials = "include";
  }

  try {
    const response = await fetch(url, options);
    const responseBody = await parseResponseBody(response);

    if (response.ok) {
      return responseBody as T;
    }

    return createErrorResponse<T>(response, responseBody);
  } catch (error) {
    return {
      statusCode: 0,
      message: error instanceof Error ? error.message : "Network error",
      error: "NETWORK_ERROR",
      data: null,
    } as T;
  }
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

export const loginAPI = (payload: LoginPayload) => {
  return sendRequest<IBackendRes<AuthUserResponse>>({
    url: `${AUTH_URL}/login`,
    method: "POST",
    body: payload,
  });
};

export const getAccountApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<{ user: IUser }>>({
    url: `${AUTH_URL}/account`,
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const refreshTokenApi = (refreshToken: string) => {
  return sendRequest<IBackendRes<AuthUserResponse>>({
    url: `${AUTH_URL}/refresh`,
    method: "POST",
    body: {
      refresh_token: refreshToken,
    },
  });
};

export const logoutApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<null>>({
    url: `${AUTH_URL}/logout`,
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
          avatarUrl: payload.avatarUrl || payload.image,
          username: payload.username || payload.email,
          email: payload.email || payload.username,
        };

  return sendRequest<IBackendRes<AuthUserResponse>>({
    url: `${AUTH_URL}/social-media`,
    method: "POST",
    body,
  });
};

export const registerApi = (payload: RegisterPayload) => {
  return sendRequest<IBackendRes<IUser>>({
    url: `${AUTH_URL}/register`,
    method: "POST",
    body: payload,
  });
};

export const registerWithOtpAPI = registerApi;

export const verifyRegisterOtpAPI = (payload: VerifyOtpPayload) => {
  return sendRequest<IBackendRes<IUser>>({
    url: `${AUTH_URL}/verify-otp`,
    method: "POST",
    body: payload,
  });
};

export const resendRegisterOtpAPI = (email: string) => {
  return sendRequest<IBackendRes<null>>({
    url: `${AUTH_URL}/resend-otp`,
    method: "POST",
    body: { email },
  });
};

export const forgotPasswordAPI = (payload: ForgotPasswordPayload) => {
  return sendRequest<IBackendRes<null>>({
    url: `${AUTH_URL}/forgot-password`,
    method: "POST",
    body: payload,
  });
};

export const resetPasswordAPI = (payload: ResetPasswordPayload) => {
  return sendRequest<IBackendRes<null>>({
    url: `${AUTH_URL}/reset-password`,
    method: "POST",
    body: payload,
  });
};

/* =========================
   USERS APIs
========================= */

export const getAllUsersApi = (accessToken?: string) => {
  return sendRequest<
    IBackendRes<{
      result: IUser[];
      total?: number;
    }>
  >({
    url: "/api/v1/users/all",
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const getUsersApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<IUser>>>({
    url: "/api/v1/users",
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
      ...((params as any).sort ? { sort: (params as any).sort } : {}),
    },
    headers: authHeaders(accessToken),
  });
};

export const getUserByIdApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<IUser>>({
    url: `/api/v1/users/${encodeURIComponent(id)}`,
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const createUserApi = (
  payload: CreateUserPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IUser>>({
    url: "/api/v1/users",
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const updateUserApi = (
  payload: UpdateUserPayload,
  accessToken?: string
) => {
  const id = (payload as any)?._id || (payload as any)?.id;

  return sendRequest<IBackendRes<IUser>>({
    url: id
      ? `/api/v1/users/update/${encodeURIComponent(id)}`
      : "/api/v1/users",
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const updateMyProfileApi = (
  payload: UpdateMyProfilePayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IUser>>({
    url: "/api/v1/users/me",
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const deleteUserApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<null>>({
    url: `/api/v1/users/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

export const getArtistLeaderboard = async (
  limit = 10
): Promise<ArtistLeaderboardItem[]> => {
  const response = await sendRequest<ArtistLeaderboardResponse>({
    url: "/api/v1/users/leaderboard/artists",
    method: "GET",
    queryParams: {
      limit: Math.max(limit, 1),
    },
    nextOption: {
      cache: "no-store",
    },
  });

  return Array.isArray((response as any)?.data) ? (response as any).data : [];
};

/* =========================
   FOLLOW APIs
   FollowController là nơi duy nhất xử lý.
========================= */

export const followUserApi = async (userId: string, accessToken?: string) => {
  const response = await sendRequest<IBackendRes<FollowStatusData>>({
    url: `/api/v1/users/${encodeURIComponent(userId)}/follow`,
    method: "POST",
    headers: authHeaders(accessToken),
  });

  return normalizeFollowResponse(response);
};

export const unfollowUserApi = async (userId: string, accessToken?: string) => {
  const response = await sendRequest<IBackendRes<FollowStatusData>>({
    url: `/api/v1/users/${encodeURIComponent(userId)}/follow`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });

  return normalizeFollowResponse(response);
};

export const getFollowStatusApi = async (
  userId: string,
  accessToken?: string
) => {
  const response = await sendRequest<IBackendRes<FollowStatusData>>({
    url: `/api/v1/users/${encodeURIComponent(userId)}/follow-status`,
    method: "GET",
    headers: authHeaders(accessToken),
  });

  return normalizeFollowResponse(response);
};

export const getUserFollowingApi = (
  userId: string,
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<FollowListData>>({
    url: `/api/v1/users/${encodeURIComponent(userId)}/following`,
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 20,
    },
    headers: authHeaders(accessToken),
  });
};

export const getUserFollowersApi = (
  userId: string,
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<FollowListData>>({
    url: `/api/v1/users/${encodeURIComponent(userId)}/followers`,
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 20,
    },
    headers: authHeaders(accessToken),
  });
};

export const getMyFollowingApi = (accessToken?: string) => {
  return sendRequest<
    IBackendRes<{
      result: IUser[];
      total: number;
    }>
  >({
    url: "/api/v1/users/me/following",
    method: "GET",
    headers: authHeaders(accessToken),
    nextOption: {
      cache: "no-store",
    },
  });
};
export const getMyFollowersApi = async (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  const account = await getAccountApi(accessToken);
  const user = (account as any)?.data?.user || (account as any)?.data;

  const userId = getUserId(user);

  if (!userId) {
    return {
      statusCode: (account as any)?.statusCode || 401,
      message: (account as any)?.message || "Cannot resolve current user",
      error: (account as any)?.error || "UNAUTHORIZED",
      data: null,
    } as IBackendRes<FollowListData>;
  }

  return getUserFollowersApi(userId, accessToken, params);
};

/* =========================
   TRACKS APIs
========================= */

export const getTracksApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
    url: "/api/v1/tracks",
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const getAllTracksApi = () => {
  return sendRequest<IBackendRes<{ result: ITrackTop[] }>>({
    url: "/api/v1/tracks/find-all",
    method: "GET",
  });
};

export const getTrackByIdApi = (id: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: `/api/v1/tracks/search/${encodeURIComponent(id)}`,
    method: "GET",
  });
};

export const getTrackBySlugOrIdApi = (slugOrId: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: `/api/v1/tracks/${encodeURIComponent(slugOrId)}`,
    method: "GET",
  });
};

export const createTrackApi = (
  payload: CreateTrackPayload | FormData,
  accessToken?: string
) => {
  return sendRequestFile<IBackendRes<ITrackTop>>({
    url: "/api/v1/tracks",
    method: "POST",
    body: toFormData(payload as any),
    headers: authHeaders(accessToken),
  });
};

export const updateTrackApi = (
  id: string,
  payload: UpdateTrackPayload | FormData,
  accessToken?: string
) => {
  return sendRequestFile<IBackendRes<ITrackTop>>({
    url: `/api/v1/tracks/${encodeURIComponent(id)}`,
    method: "PATCH",
    body: toFormData(payload as any),
    headers: authHeaders(accessToken),
  });
};

export const deleteTrackApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<null>>({
    url: `/api/v1/tracks/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

export const getTopTracksApi = (category: string, limit = 10) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: "/api/v1/tracks/top",
    method: "GET",
    queryParams: {
      category: category.toLowerCase(),
      limit,
    },
    nextOption: {
      cache: "no-store",
    },
  });
};

export const getTrackCommentsApi = (trackId: string) => {
  return sendRequest<IBackendRes<ITrackComment[]>>({
    url: `/api/v1/tracks/${encodeURIComponent(trackId)}/comments`,
    method: "GET",
  });
};

export const getMyTracksApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: "/api/v1/tracks/my-tracks",
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

/*
 * Backend hiện chưa có endpoint public:
 * GET /users/{userId}/tracks.
 * Hàm này lấy danh sách track APPROVED rồi lọc phía FE để giữ
 * tương thích với các component profile hiện tại.
 */
export const getTracksByUserApi = async (
  userId: string,
  _accessToken?: string,
  params: PaginationParams = {}
) => {
  const response = await getAllTracksApi();
  const allTracks = getResponseResult<ITrackTop>(response);

  const filtered = allTracks.filter((track: any) => {
    const uploaderId = track?.uploaderId || getUserId(track?.uploader);

    return uploaderId === userId;
  });

  const current = Math.max(Number(params.current) || 1, 1);

  const pageSize = Math.max(Number(params.pageSize) || 10, 1);

  const start = (current - 1) * pageSize;
  const result = filtered.slice(start, start + pageSize);

  return {
    ...response,
    data: {
      meta: {
        current,
        pageSize,
        pages: Math.ceil(filtered.length / pageSize),
        total: filtered.length,
      },
      result,
    },
  } as IBackendRes<IModelPaginate<ITrackTop>>;
};

export const searchTracksApi = (keyword: string) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: "/api/v1/tracks/search",
    method: "GET",
    queryParams: {
      keyword,
    },
  });
};

export const createAlbumApi = (
  payload: {
    title: string;
    isPublic?: boolean;
    trackIds: string[];
  },
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IPlaylist>>({
    url: "/api/v1/tracks/create-album",
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ADMIN TRACK APIs
========================= */

export const getAdminTracksApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
    url: "/api/v1/admin/tracks/find-all",
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const approveTrackApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: `/api/v1/admin/tracks/${encodeURIComponent(id)}/approve`,
    method: "PATCH",
    headers: authHeaders(accessToken),
  });
};

export const rejectTrackApi = (
  id: string,
  reason: string,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: `/api/v1/admin/tracks/${encodeURIComponent(id)}/reject`,
    method: "PATCH",
    body: {
      reason: reason.trim(),
    },
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ADMIN COPYRIGHT SCAN API
========================= */

export const scanTrackCopyrightApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<Record<string, any>>>({
    url: `/api/v1/admin/tracks/${encodeURIComponent(id)}/copyright-scan`,
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   FILE UPLOAD APIs
========================= */

export const uploadImageApi = (file: File, accessToken?: string) => {
  const formData = new FormData();
  formData.append("file", file);

  return sendRequestFile<IBackendRes<IUploadResponse>>({
    url: "/api/v1/uploads/image",
    method: "POST",
    body: formData,
    headers: authHeaders(accessToken),
  });
};

export const uploadTrackFileApi = (file: File, accessToken?: string) => {
  const formData = new FormData();
  formData.append("file", file);

  return sendRequestFile<IBackendRes<IUploadResponse>>({
    url: "/api/v1/uploads/audio",
    method: "POST",
    body: formData,
    headers: authHeaders(accessToken),
  });
};

/* =========================
   COMMENTS APIs
========================= */

export const getCommentsApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<
    IBackendRes<{
      result: ITrackComment[];
      current: number;
      pageSize: number;
      total: number;
    }>
  >({
    url: "/api/v1/comments",
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const createTrackCommentApi = (
  trackId: string,
  payload: CreateCommentPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ITrackComment>>({
    url: `/api/v1/tracks/${encodeURIComponent(trackId)}/comments`,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

/*
 * Alias tương thích code cũ.
 * payload phải chứa trackId vì BE không có POST /comments.
 */
export const createCommentApi = (
  payload: CreateCommentPayload,
  accessToken?: string
) => {
  const trackId = (payload as any)?.trackId || (payload as any)?.track_id;

  if (!trackId) {
    return Promise.resolve({
      statusCode: 400,
      message: "trackId is required",
      error: "BAD_REQUEST",
      data: null,
    } as IBackendRes<ITrackComment>);
  }

  return createTrackCommentApi(trackId, payload, accessToken);
};

export const deleteCommentApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<boolean>>({
    url: `/api/v1/comments/${encodeURIComponent(id)}`,
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
    url: buildUrl("/api/v1/playlists"),
    method: "POST",
    body: {
      title: payload.title,
      isPublic: payload.isPublic ?? true,
    },
    headers: authHeaders(accessToken),
  });
};

export const updatePlaylistApi = (
  payload: UpdatePlaylistPayload,
  accessToken?: string
) => {
  const id = (payload as any)?._id || (payload as any)?.id;

  return sendRequest<IBackendRes<IPlaylist>>({
    url: id
      ? `/api/v1/playlists/${encodeURIComponent(id)}`
      : "/api/v1/playlists",
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

export const deletePlaylistApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<null>>({
    url: `/api/v1/playlists/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

export const getPlaylistByIdApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<IPlaylist>>({
    url: `/api/v1/playlists/${encodeURIComponent(id)}`,
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

export const getPlaylistsApi = (
  accessToken?: string,
  params: PaginationParams = {}
) => {
  return sendRequest<IBackendRes<IModelPaginate<IPlaylist>>>({
    url: "/api/v1/playlists",
    method: "GET",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

export const getPlaylistsByUserApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IPlaylist[]>>({
    url: "/api/v1/playlists/my-playlists",
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

/*
 * Backend chưa có endpoint playlist public theo user.
 * Tạm lấy danh sách playlist rồi lọc phía FE.
 */
export const getUserPlaylistsApi = async (userId: string) => {
  const response = await getPlaylistsApi(undefined, {
    current: 1,
    pageSize: 100,
  });

  const playlists = getResponseResult<IPlaylist>(response).filter(
    (playlist: any) => {
      const ownerId = playlist?.userId || getUserId(playlist?.user);

      return ownerId === userId && !Boolean(playlist?.isAlbum);
    }
  );

  return {
    ...response,
    data: playlists,
  } as IBackendRes<IPlaylist[]>;
};

export const getUserAlbumsApi = async (userId: string) => {
  const response = await getPlaylistsApi(undefined, {
    current: 1,
    pageSize: 100,
  });

  const albums = getResponseResult<IPlaylist>(response).filter(
    (playlist: any) => {
      const ownerId = playlist?.userId || getUserId(playlist?.user);

      return ownerId === userId && Boolean(playlist?.isAlbum);
    }
  );

  return {
    ...response,
    data: albums,
  } as IBackendRes<IPlaylist[]>;
};

/* =========================
   LIKES APIs
========================= */

export const likeTrackApi = (trackId: string, accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: `/api/v1/tracks/${encodeURIComponent(trackId)}/like`,
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const dislikeTrackApi = (trackId: string, accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop>>({
    url: `/api/v1/tracks/${encodeURIComponent(trackId)}/dislike`,
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

export const getLikedTracksApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: "/api/v1/tracks/liked",
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

/*
 * BE chỉ hỗ trợ liked tracks của tài khoản đang đăng nhập.
 * Giữ userId trong chữ ký để không làm vỡ code FE cũ.
 */
export const getUserLikedTracksApi = (
  _userId: string,
  accessToken?: string
) => {
  return getLikedTracksApi(accessToken);
};

/* =========================
   CATEGORY APIs
========================= */

export const getCategories = (
  current = 1,
  pageSize = 100,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IModelPaginate<ICategory> | ICategory[]>>({
    url: "/api/v1/categories",
    method: "GET",
    queryParams: {
      current,
      pageSize,
    },
    headers: authHeaders(accessToken),
    nextOption: {
      cache: "no-store",
    },
  });
};

export const getAllCategories = () => {
  return sendRequest<IBackendRes<ICategory[]>>({
    url: "/api/v1/categories/all",
    method: "GET",
  });
};

export const getCategoryById = (id: string) => {
  return sendRequest<IBackendRes<ICategory>>({
    url: `/api/v1/categories/${encodeURIComponent(id)}`,
    method: "GET",
  });
};

export const getCategoryBySlug = (slug: string) => {
  return sendRequest<IBackendRes<ICategory>>({
    url: `/api/v1/categories/slug/${encodeURIComponent(slug)}`,
    method: "GET",
  });
};

export const createCategory = (data: ICreateCategory, accessToken?: string) => {
  return sendRequest<IBackendRes<ICategory>>({
    url: "/api/v1/categories",
    method: "POST",
    headers: authHeaders(accessToken),
    body: data,
  });
};

export const updateCategory = (
  id: string,
  data: IUpdateCategory,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ICategory>>({
    url: `/api/v1/categories/${encodeURIComponent(id)}`,
    method: "PUT",
    headers: authHeaders(accessToken),
    body: data,
  });
};

export const deleteCategoryApi = (id: string, accessToken?: string) => {
  return sendRequest<IBackendRes<null>>({
    url: `/api/v1/categories/${encodeURIComponent(id)}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

export const getTracksByCategory = (categorySlug: string) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: "/api/v1/tracks/top",
    method: "GET",
    queryParams: {
      category: categorySlug,
    },
  });
};

/* =========================
   NEXT REVALIDATE API
========================= */

export const revalidateApi = (tag: string) => {
  return sendRequest<IBackendRes<any>>({
    url: "/api/revalidate",
    method: "POST",
    queryParams: {
      tag,
      secret: "justArandomString",
    },
  });
};

/* =========================
   MAIN SLIDERS API
========================= */
export const saveListeningProgressApi = (
  trackId: string,
  payload: ListeningProgressPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IListeningHistoryItem>>({
    url: `/api/v1/tracks/${encodeURIComponent(trackId)}/history`,
    method: "POST",
    body: {
      sessionId: payload.sessionId?.trim() || undefined,
      position: Math.max(Number(payload.position) || 0, 0),
      duration: Math.max(Number(payload.duration) || 0, 0),
      completed: Boolean(payload.completed),
      playing: Boolean(payload.playing),
    },
    headers: authHeaders(accessToken),
  });
};

export const getHomeListeningHistoryApi = (
  accessToken?: string,
  limit = 10
) => {
  return sendRequest<IBackendRes<IHomeListeningHistoryData>>({
    url: "/api/v1/tracks/history/home",
    method: "GET",
    queryParams: {
      limit: Math.min(Math.max(limit, 1), 20),
    },
    headers: authHeaders(accessToken),
    nextOption: {
      cache: "no-store",
    },
  });
};

export const getBecauseYouListenedApi = (accessToken?: string, limit = 10) => {
  return sendRequest<IBackendRes<IBecauseYouListenedData>>({
    url: "/api/v1/tracks/because-you-listened",
    method: "GET",
    queryParams: {
      limit: Math.min(Math.max(limit, 1), 20),
    },
    headers: authHeaders(accessToken),
    nextOption: {
      cache: "no-store",
    },
  });
};

export const getHiddenGemsApi = (limit = 10, maxPlays = 1000) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: "/api/v1/tracks/hidden-gems",
    method: "GET",
    queryParams: {
      limit: Math.min(Math.max(limit, 1), 20),
      maxPlays: Math.max(maxPlays, 0),
    },
    nextOption: {
      cache: "no-store",
    },
  });
};

/* =========================
   who to follow API
========================= */
export const getWhoToFollowApi = (limit = 12) => {
  return sendRequest<IBackendRes<IUser[]>>({
    url:
      `${process.env.NEXT_PUBLIC_BACKEND_URL}` + `/api/v1/users/who-to-follow`,
    method: "GET",
    queryParams: {
      limit: Math.min(Math.max(limit, 1), 24),
    },
    nextOption: {
      cache: "no-store",
    },
  });
};

/* =========================
   copyright strike API
========================= */

export const getMyStudioTracksApi = (accessToken: string) => {
  return sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}` + "/api/v1/tracks/my-tracks",
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    nextOption: {
      cache: "no-store",
    },
  });
};

/* =========================
   SUBSCRIPTION APIs
========================= */

export const getSubscriptionPlansApi = () => {
  return sendRequest<IBackendRes<ISubscriptionPlan[]>>({
    url: "/api/v1/subscriptions/plans",
    method: "GET",
    nextOption: {
      cache: "no-store",
    },
  });
};

export const getMySubscriptionApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IMySubscriptionData>>({
    url: "/api/v1/subscriptions/me",
    method: "GET",
    headers: authHeaders(accessToken),
    nextOption: {
      cache: "no-store",
    },
  });
};

export const getMySubscriptionUsageApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<ISubscriptionUsage>>({
    url: "/api/v1/subscriptions/me/usage",
    method: "GET",
    headers: authHeaders(accessToken),
    nextOption: {
      cache: "no-store",
    },
  });
};

export const subscribePlanApi = (
  planCode: SubscriptionPlanCode,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IMySubscriptionData>>({
    url: "/api/v1/subscriptions/subscribe",
    method: "POST",
    body: {
      planCode,
    },
    headers: authHeaders(accessToken),
  });
};

export const changeSubscriptionPlanApi = (
  planCode: SubscriptionPlanCode,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IMySubscriptionData>>({
    url: "/api/v1/subscriptions/change-plan",
    method: "POST",
    body: {
      planCode,
    },
    headers: authHeaders(accessToken),
  });
};

export const cancelSubscriptionApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IMySubscriptionData>>({
    url: "/api/v1/subscriptions/cancel",
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

/* =========================
Benefits
========================= */

export const getArtistBenefitsApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IArtistBenefit[]>>({
    url: "/api/v1/artist-studio/benefits",
    method: "GET",

    headers: authHeaders(accessToken),

    nextOption: {
      cache: "no-store",
    },
  });
};

export const getAdminArtistBenefitsApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IArtistBenefit[]>>({
    url: "/api/v1/admin/artist-benefits",
    method: "GET",
    headers: authHeaders(accessToken),
    nextOption: {
      cache: "no-store",
    },
  });
};

export const createAdminArtistBenefitApi = (
  payload: IArtistBenefitPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IArtistBenefit>>({
    url: "/api/v1/admin/artist-benefits",
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
};

export const updateAdminArtistBenefitApi = (
  benefitId: string,
  payload: IArtistBenefitPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IArtistBenefit>>({
    url: `/api/v1/admin/artist-benefits/${encodeURIComponent(benefitId)}`,
    method: "PUT",
    headers: authHeaders(accessToken),
    body: payload,
  });
};

export const toggleAdminArtistBenefitApi = (
  benefitId: string,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<IArtistBenefit>>({
    url: `/api/v1/admin/artist-benefits/${encodeURIComponent(
      benefitId
    )}/toggle`,
    method: "PATCH",
    headers: authHeaders(accessToken),
  });
};

export const deleteAdminArtistBenefitApi = (
  benefitId: string,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<null>>({
    url: `/api/v1/admin/artist-benefits/${encodeURIComponent(benefitId)}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
};

/* =========================
artist studio  stats APIs
========================= */
export const getArtistStudioStatsApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IArtistStudioStats>>({
    url: "/api/v1/artist-studio/stats",
    method: "GET",

    headers: authHeaders(accessToken),

    nextOption: {
      cache: "no-store",
    },
  });
};

/* =========================
Notifications APIs
========================= */

export const getNotificationsApi = (
  page: number = 0,
  size: number = 20,
  status: "all" | "unread" = "all",
  accessToken?: string
) => {
  const safePage = Math.max(page, 0);
  const safeSize = Math.min(Math.max(size, 1), 100);

  return sendRequest<IBackendRes<INotificationPage>>({
    url: `/api/v1/notifications?page=${safePage}&size=${safeSize}&status=${encodeURIComponent(
      status
    )}`,
    method: "GET",

    headers: authHeaders(accessToken),

    nextOption: {
      cache: "no-store",
    },
  });
};

export const getUnreadNotificationCountApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<IUnreadNotificationCount>>({
    url: "/api/v1/notifications/unread-count",
    method: "GET",

    headers: authHeaders(accessToken),

    nextOption: {
      cache: "no-store",
    },
  });
};

export const markNotificationAsReadApi = (
  notificationId: string,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<INotification>>({
    url: `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
    method: "PATCH",

    headers: authHeaders(accessToken),
  });
};

export const markAllNotificationsAsReadApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<number>>({
    url: "/api/v1/notifications/read-all",
    method: "PATCH",

    headers: authHeaders(accessToken),
  });
};

export const deleteNotificationApi = (
  notificationId: string,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<null>>({
    url: `/api/v1/notifications/${encodeURIComponent(notificationId)}`,
    method: "DELETE",

    headers: authHeaders(accessToken),
  });
};

export const clearReadNotificationsApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<number>>({
    url: "/api/v1/notifications/clear-read",
    method: "DELETE",

    headers: authHeaders(accessToken),
  });
};

/* =========================
   ARTIST WALLET
========================= */

export const getArtistWalletApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<ArtistWalletData>>({
    url: "/api/v1/artist/earnings/wallet",
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ARTIST EARNING HISTORY
========================= */

export const getArtistEarningHistoryApi = (
  accessToken?: string,
  params: ArtistEarningQueryParams = {}
) => {
  return sendRequest<IBackendRes<ArtistEarningHistoryData>>({
    url: "/api/v1/artist/earnings/history",
    method: "GET",
    queryParams: {
      status: params.status,
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ARTIST EARNING SUMMARY
========================= */

export const getArtistEarningSummaryApi = (accessToken?: string) => {
  return sendRequest<IBackendRes<ArtistEarningSummaryData>>({
    url: "/api/v1/artist/earnings/summary",
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ARTIST CREATE PAYOUT
========================= */

export const createArtistPayoutRequestApi = (
  payload: CreateArtistPayoutPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ArtistPayoutActionData>>({
    url: "/api/v1/artist/earnings/payouts",
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ARTIST PAYOUT HISTORY
========================= */

export const getArtistPayoutHistoryApi = (
  accessToken?: string,
  params: ArtistPayoutQueryParams = {}
) => {
  return sendRequest<IBackendRes<ArtistPayoutHistoryData>>({
    url: "/api/v1/artist/earnings/payouts",
    method: "GET",
    queryParams: {
      status: params.status,
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ARTIST CANCEL PAYOUT
========================= */

export const cancelArtistPayoutRequestApi = (
  payoutRequestId: string,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ArtistPayoutActionData>>({
    url: `/api/v1/artist/earnings/payouts/${encodeURIComponent(
      payoutRequestId
    )}/cancel`,
    method: "POST",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ADMIN GET PAYOUT LIST
========================= */

export const getAdminArtistPayoutsApi = (
  accessToken?: string,
  params: ArtistPayoutQueryParams = {}
) => {
  return sendRequest<IBackendRes<ArtistPayoutHistoryData>>({
    url: "/api/v1/admin/artist-payouts",
    method: "GET",
    queryParams: {
      status: params.status,
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ADMIN GET PAYOUT DETAIL
========================= */

export const getAdminArtistPayoutDetailApi = (
  payoutRequestId: string,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ArtistPayoutActionData>>({
    url: `/api/v1/admin/artist-payouts/${encodeURIComponent(payoutRequestId)}`,
    method: "GET",
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ADMIN APPROVE PAYOUT
========================= */

export const approveAdminArtistPayoutApi = (
  payoutRequestId: string,
  payload: ApproveArtistPayoutPayload = {},
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ArtistPayoutActionData>>({
    url: `/api/v1/admin/artist-payouts/${encodeURIComponent(
      payoutRequestId
    )}/approve`,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ADMIN REJECT PAYOUT
========================= */

export const rejectAdminArtistPayoutApi = (
  payoutRequestId: string,
  payload: RejectArtistPayoutPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ArtistPayoutActionData>>({
    url: `/api/v1/admin/artist-payouts/${encodeURIComponent(
      payoutRequestId
    )}/reject`,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

/* =========================
   ADMIN MARK PAYOUT PAID
========================= */

export const markAdminArtistPayoutPaidApi = (
  payoutRequestId: string,
  payload: MarkArtistPayoutPaidPayload,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<ArtistPayoutActionData>>({
    url: `/api/v1/admin/artist-payouts/${encodeURIComponent(
      payoutRequestId
    )}/paid`,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
};

/* =========================
   CREATE VNPAY PAYMENT
========================= */

export const createVnPayPaymentApi = (
  planCode: SubscriptionPlanCode,
  accessToken?: string
) => {
  return sendRequest<IBackendRes<Record<string, any>>>({
    url: "/api/v1/payments/vnpay/create",
    method: "POST",
    body: {
      planCode,
    },
    headers: authHeaders(accessToken),
  });
};

/* =========================

========================= */
