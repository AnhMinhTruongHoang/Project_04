export {};

declare global {
  type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "OPTIONS";

  type UserRole = "USER" | "ADMIN" | string;

  type UserType =
    | "SYSTEM"
    | "GOOGLE"
    | "GITHUB"
    | "FACEBOOK"
    | "ARTIST"
    | "SOCIAL"
    | string;

  type SubscriptionTier = "FREE" | "ARTIST" | "ARTIST_PRO" | string;

  type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

  type TrackCategory =
    | "NCS"
    | "KPOP"
    | "LOFI"
    | "POP"
    | "EDM"
    | "CHILL"
    | "WORKOUT"
    | "PARTY"
    | "REMIX"
    | "RAP"
    | "HIPHOP"
    | "ROCK"
    | "ACOUSTIC"
    | "INSTRUMENTAL"
    | "BALLAD"
    | "INDIE"
    | "RNB"
    | string;

  interface IRequest {
    url: string;
    method: HttpMethod | string;
    body?: unknown;
    queryParams?: Record<string, unknown>;
    useCredentials?: boolean;
    headers?: Record<string, string>;
    nextOption?: Record<string, any>;
  }

  type RequestFileProps = Omit<IRequest, "body"> & {
    body?: BodyInit | FormData | null;
  };

  interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T | null;
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

  /**
   * Kiểu Page mặc định do Spring Data trả về.
   * Dùng cho các endpoint backend chưa chuyển sang meta/result.
   */
  interface ISpringPage<T> {
    content: T[];
    pageable?: unknown;
    totalPages: number;
    totalElements: number;
    last?: boolean;
    first?: boolean;
    size: number;
    number: number;
    numberOfElements?: number;
    empty?: boolean;
    sort?: unknown;
  }

  interface IUser {
    _id?: string;
    id?: string;

    email?: string;
    username?: string;
    name?: string;

    role?: UserRole;
    type?: UserType;
    subscriptionTier?: SubscriptionTier;

    age?: number | null;
    gender?: string | null;
    address?: string | null;

    isVerify?: boolean;
    verified?: boolean;

    avatarUrl?: string | null;
    avatar?: string | null;
    image?: string | null;
    coverUrl?: string | null;

    bio?: string | null;
    website?: string | null;
    city?: string | null;
    country?: string | null;
    spotlightTrackId?: string | null;

    followers?: number;
    following?: number;

    isDeleted?: boolean;

    createdAt?: string;
    updatedAt?: string;
  }

  interface IAuthLoginPayload {
    email: string;
    password: string;
  }

  interface IAuthRegisterPayload {
    name: string;
    email: string;
    password: string;
    age?: number | string;
    gender?: string;
    address?: string;
  }

  interface IAuthAccount {
    user: IUser;
  }

  type AuthUserResponse = {
    access_token: string;
    refresh_token: string;
    user: IUser;
  };

  type LoginPayload = {
    email: string;
    password: string;
  };

  type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    age?: number | string;
    gender?: string;
    address?: string;
    avatarUrl?: string;
  };

  type VerifyOtpPayload = {
    email: string;
    otp: string;
  };

  type ForgotPasswordPayload = {
    email: string;
  };

  type ResetPasswordPayload = {
    email: string;
    otp: string;
    newPassword: string;
  };

  type CreateUserPayload = {
    name: string;
    email: string;
    password: string;

    username?: string;
    role?: UserRole;
    type?: UserType;
    subscriptionTier?: SubscriptionTier;

    age?: number;
    gender?: string;

    isVerify?: boolean;
    verified?: boolean;

    avatarUrl?: string;
    coverUrl?: string;
    bio?: string;
    website?: string;
    city?: string;
    country?: string;
    spotlightTrackId?: string;
  };

  interface UpdateUserPayload {
    _id?: string;
    id?: string;

    email?: string;
    username?: string;
    password?: string;
    name?: string;

    role?: UserRole;
    type?: UserType;
    subscriptionTier?: SubscriptionTier;

    age?: number;
    gender?: string;

    isVerify?: boolean;
    verified?: boolean;

    avatarUrl?: string;
    coverUrl?: string;
    website?: string;
    bio?: string;
    city?: string;
    country?: string;
    spotlightTrackId?: string;
  }

  interface ITrackTop {
    _id?: string;
    id?: string;

    title: string;
    slug?: string;
    description?: string;

    category?: TrackCategory | null;
    categoryId?: string | null;
    categoryName?: string | null;

    imgUrl?: string | null;
    trackUrl?: string | null;

    countLike?: number;
    countPlay?: number;

    uploaderId?: string | null;
    uploader?: IUser | null;

    approvalStatus?: ApprovalStatus;

    rejectionReason?: string | null;

    audioHash?: string | null;
    audioSize?: number | null;
    processingStatus?: string | null;
    copyrightStatus?: string | null;
    copyrightMessage?: string | null;
    copyrightScore?: number | null;

    scannedAt?: string | null;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;

    /**
     * Alias/fallback media được một số component cũ sử dụng.
     */
    image?: string;
    thumbnail?: string;
    audio?: string;
    audioUrl?: string;
  }

  interface IListeningHistoryItem {
    track: ITrackTop;

    lastPosition: number;
    duration: number;
    progress: number;
    completed: boolean;

    lastPlayedAt?: string;
  }

  interface IHomeListeningHistoryData {
    continueListening: IListeningHistoryItem[];
    recentlyPlayed: IListeningHistoryItem[];
  }

  interface IBecauseYouListenedData {
    basedOn: ITrackTop | null;
    result: ITrackTop[];
  }

  type ListeningProgressPayload = {
    position: number;
    duration: number;
    completed?: boolean;
  };

  type CreateTrackPayload = {
    title: string;
    description: string;
    category: string;

    /**
     * TrackController nhận multipart/form-data.
     */
    image: File;
    audio: File;

    /**
     * Giữ tương thích với form/component cũ.
     */
    imgUrl?: string;
    trackUrl?: string;
  };

  type ICreateTrackPayload = CreateTrackPayload;

  type UpdateTrackPayload = {
    /**
     * Backend hiện yêu cầu ba trường này khi update multipart.
     */
    title: string;
    description: string;
    category: string;

    image?: File;
    audio?: File;

    imgUrl?: string;
    trackUrl?: string;
  };

  type IUpdateTrackPayload = UpdateTrackPayload;

  interface IShareTrack extends ITrackTop {
    isPlaying: boolean;
  }

  interface ITrackContext {
    currentTrack: IShareTrack | null;
    setCurrentTrack: (value: IShareTrack | null) => void;
  }

  interface ITrackComment {
    _id?: string;
    id?: string;

    content: string;
    moment?: number | null;

    userId?: string;
    user?: IUser;

    trackId?: string;
    track?: string | ITrackTop;

    isDeleted?: boolean;

    createdAt?: string;
    updatedAt?: string;
  }

  type CreateCommentPayload = {
    content: string;
    moment?: number;

    /**
     * Các alias này giữ tương thích với component và createCommentApi.
     */
    trackId?: string;
    track_id?: string;
    track?: string;
  };

  type ICreateCommentPayload = CreateCommentPayload;

  interface ITrackLike {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    category?: TrackCategory;
    imgUrl?: string;
    trackUrl?: string;
    countLike?: number;
    countPlay?: number;
    createdAt?: string;
    updatedAt?: string;
  }

  type LikePayload = {
    track: string;
    quantity: 1 | -1;
  };

  type ILikePayload = LikePayload;

  interface IPlaylist {
    _id?: string;
    id?: string;

    title: string;
    isPublic?: boolean;
    isAlbum?: boolean;

    userId?: string;
    user?: string | IUser | null;

    tracks?: Array<IShareTrack | ITrackTop | string>;

    isDeleted?: boolean;

    createdAt?: string;
    updatedAt?: string;
  }

  type CreatePlaylistPayload = {
    title: string;
    isPublic?: boolean;
    trackIds?: string[];
    tracks?: string[];
  };

  type ICreatePlaylistPayload = CreatePlaylistPayload;

  type UpdatePlaylistPayload = {
    _id?: string;
    id?: string;

    title?: string;
    isPublic?: boolean;

    trackIds?: string[];
    tracks?: Array<string | ITrackTop>;
  };

  type IUpdatePlaylistPayload = UpdatePlaylistPayload;

  interface IUploadResponse {
    fileName: string;
    url: string;
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
    sort?: string;
  };

  type FileTargetType = "images" | "tracks";

  type ArtistLeaderboardItem = {
    _id?: string;
    id?: string;
    name: string;
    email?: string;
    username?: string;
    avatarUrl?: string;
    avatar?: string;
    role?: UserRole;
    type?: UserType;
    followers?: number | null;
    following?: number | null;
    tracks?: number | null;
    trackCount?: number | null;
    totalTracks?: number | null;
  };

  type ArtistLeaderboardResponse = {
    statusCode?: number | string;
    message?: string;
    error?: string | string[];
    data?: ArtistLeaderboardItem[] | null;
  };

  /// upload

  export type TrackUploadState = {
    fileName: string;
    percent: number;
    uploadedTrackName: string;
    audioFile: File | null;
  };

  interface INewTrack {
    title: string;
    description: string;
    category: string;
    imageFile: File | null;
    imagePreview: string;
  }

  ///

  interface FollowStatusData {
    following: boolean;
    isFollowing: boolean;
    targetFollowers: number;
    currentUserFollowing: number;
    user?: IUser;
  }

  interface FollowListData {
    meta: {
      current: number;
      pageSize: number;
      pages: number;
      total: number;
    };
    result: IUser[];
  }

  interface ICategory {
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

  interface ICreateCategory {
    name: string;
    slug?: string;
    description?: string;
  }

  interface IUpdateCategory {
    name?: string;
    slug?: string;
    description?: string;
    isDeleted?: boolean;
  }
}
