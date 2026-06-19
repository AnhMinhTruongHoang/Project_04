import queryString from "query-string";
import slugify from "slugify";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const buildUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api")) return path;
  return `${BACKEND_URL}${path}`;
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

export const loginApi = (payload: LoginPayload) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/v1/auth/login"),
    method: "POST",
    body: payload,
  });
};

export const registerApi = (payload: RegisterPayload) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/v1/auth/register"),
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

export const socialMediaLoginApi = (type: string, username: string) => {
  return sendRequest<IBackendRes<any>>({
    url: buildUrl("/api/v1/auth/social-media"),
    method: "POST",
    body: {
      type,
      username,
    },
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
  return sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
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
  return sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
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
  return sendRequest<IBackendRes<IModelPaginate<IPlaylist>>>({
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
  return sendRequest<IBackendRes<IModelPaginate<IPlaylist>>>({
    url: buildUrl("/api/v1/playlists/by-user"),
    method: "POST",
    queryParams: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 10,
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
