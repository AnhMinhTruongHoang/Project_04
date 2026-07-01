export {};

declare global {
  type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

  type UserRole = "USER" | "ADMIN" | string;

  type UserType = "SYSTEM" | "GOOGLE" | "GITHUB" | "ARTIST" | string;

  type TrackCategory =
    | "CHILL"
    | "WORKOUT"
    | "PARTY"
    | "RAP"
    | "HIPHOP"
    | string;

  interface IRequest {
    url: string;
    method: HttpMethod | string;
    body?: Record<string, any>;
    queryParams?: Record<string, any>;
    useCredentials?: boolean;
    headers?: Record<string, any>;
    nextOption?: any;
  }

  interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
  }

  interface IModelPaginate<T> {
    meta: {
      current: number;
      pageSize: number;
      pages: number;
      total: number;
    };
    result: T[];
  }

  interface IUser {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
    type: UserType;
    age?: number;
    gender?: string;
    address?: string;
    isVerify?: boolean;
    avatarUrl?: string;
    followers?: number;
    following?: number;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }

  interface IAuthLoginPayload {
    username: string;
    password: string;
  }

  interface IAuthRegisterPayload {
    name: string;
    email: string;
    password: string;
    age: number | string;
    gender: string;
    address: string;
  }

  interface IAuthAccount extends IUser {
    access_token?: string;
    refresh_token?: string;
  }

  interface ITrackTop {
    _id: string;
    title: string;
    description: string;
    category: TrackCategory;
    imgUrl: string;
    trackUrl: string;
    countLike: number;
    countPlay: number;
    uploader: IUser;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;

    /**
     * Các field optional này để tránh lỗi khi fallback media
     * hoặc khi API/backend trả tên field khác.
     */
    image?: string;
    thumbnail?: string;
    audio?: string;
    audioUrl?: string;
  }

  interface ICreateTrackPayload {
    title: string;
    description: string;
    trackUrl: string;
    imgUrl: string;
    category: TrackCategory;
  }

  interface IUpdateTrackPayload {
    title?: string;
    description?: string;
    category?: TrackCategory;
    trackUrl?: string;
    imgUrl?: string;
  }

  interface IShareTrack extends ITrackTop {
    isPlaying: boolean;
  }

  interface ITrackContext {
    currentTrack: IShareTrack;
    setCurrentTrack: (v: IShareTrack) => void;
  }

  interface ITrackComment {
    _id: string;
    content: string;
    moment: number;
    user: IUser;
    track: string | ITrackTop;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface ICreateCommentPayload {
    content: string;
    moment: number;
    track: string;
  }

  interface ITrackLike {
    _id: string;
    title: string;
    description: string;
    category: TrackCategory;
    imgUrl: string;
    trackUrl: string;
    countLike: number;
    countPlay: number;
    createdAt: string;
    updatedAt: string;
  }

  interface ILikePayload {
    track: string;
    quantity: 1 | -1;
  }

  interface IPlaylist {
    _id: string;
    title: string;
    isPublic: boolean;
    user: string | IUser;
    tracks: IShareTrack[] | ITrackTop[] | string[];
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface ICreatePlaylistPayload {
    title: string;
    isPublic: boolean;
  }

  interface IUpdatePlaylistPayload {
    id: string;
    title: string;
    isPublic: boolean;
    tracks: string[];
  }

  interface IUploadFileResponse {
    fileName: string;
    path?: string;
    mimetype?: string;
  }

  interface ISearchTrackPayload {
    title: string;
    current: number;
    pageSize: number;
  }

  interface ITopTrackPayload {
    category: TrackCategory;
    limit: number;
  }

  interface IIncreaseViewPayload {
    trackId: string;
  }

  interface IGetTracksByUserPayload {
    id: string;
  }

  type PaginationParams = {
    current?: number;
    pageSize?: number;
  };

  type FileTargetType = "images" | "tracks";

  type LoginPayload = {
    username: string;
    password: string;
  };

  type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    age: number | string;
    gender: string;
    address: string;
  };

  type CreateUserPayload = {
    name: string;
    email: string;
    password: string;
    age: number | string;
    gender: string;
    address: string;
    role: string;
  };

  type UpdateUserPayload = {
    _id: string;
    name?: string;
    email?: string;
    age?: number | string;
    gender?: string;
    address?: string;
    role?: string;
  };

  type CreateTrackPayload = {
    title: string;
    description: string;
    trackUrl: string;
    category: string;
    imgUrl: string;
  };

  type UpdateTrackPayload = {
    title?: string;
    description?: string;
    category?: string;
  };

  type CreateCommentPayload = {
    content: string;
    moment: number;
    track: string;
  };

  type CreatePlaylistPayload = {
    title: string;
    isPublic: boolean;
  };

  type UpdatePlaylistPayload = {
    id: string;
    title: string;
    isPublic: boolean;
    tracks: string[];
  };

  type LikePayload = {
    track: string;
    quantity: 1 | -1;
  };

  type RequestFileProps = Omit<IRequest, "body"> & {
    body?: BodyInit | FormData | null;
  };

  export type ArtistLeaderboardItem = {
    _id?: string;
    id?: string;
    name: string;
    email?: string;
    username?: string;
    avatarUrl?: string;
    avatar?: string;
    role?: string;
    type?: string;
    followers?: number | null;
    following?: number | null;
    tracks?: number | null;
    trackCount?: number | null;
    totalTracks?: number | null;
  };

  type ArtistLeaderboardResponse = {
    statusCode?: number;
    message?: string;
    data?: ArtistLeaderboardItem[];
  };

  export interface ICategory {
    _id?: string;
    id?: string;
    name: string;
    slug: string;
    description?: string;
    isDeleted?: boolean;
    trackCount?: number;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface ICreateCategory {
    name: string;
    slug?: string;
    description?: string;
  }

  export interface IUpdateCategory {
    name?: string;
    slug?: string;
    description?: string;
    isDeleted?: boolean;
  }

  /// mail type

  export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    address?: string;
    avatarUrl?: string;
  };

  export type VerifyOtpPayload = {
    email: string;
    otp: string;
  };

  export type ForgotPasswordPayload = {
    email: string;
  };

  export type ResetPasswordPayload = {
    email: string;
    otp: string;
    newPassword: string;
  };

  export type LoginPayload = {
    email: string;
    password: string;
  };

  export type AuthUserResponse = {
    id?: string;
    _id?: string;
    email: string;
    name: string;
    role?: string;
    type?: string;
    isVerify?: boolean;
    avatarUrl?: string;
    access_token?: string;
    refresh_token?: string;
  };
}
