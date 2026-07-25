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

    durationSeconds?: number;

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

  type EditUserState = {
    _id: string;
    name: string;
    email: string;
    age: string | number;
    gender: string;
    address: string;
    role: string;
    avatarUrl?: string;
    avatar?: string;
    image?: string;
    picture?: string;
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

  type TrackUploadState = {
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

  export interface IArtistBenefit {
    id: string;
    title: string;
    description?: string;
    saveLabel?: string;
    imageUrl?: string | null;

    sortOrder: number;
    active: boolean;

    createdAt?: string;
    updatedAt?: string;
  }

  export interface IArtistBenefitPayload {
    title: string;
    description?: string;
    saveLabel?: string;
    imageUrl?: string | null;
    sortOrder: number;
    active: boolean;
  }

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

  interface IMySubscriptionData {
    plan: ISubscriptionPlan;
    subscription: IUserSubscription;
    usage: ISubscriptionUsage;
  }

  interface ISubscribePlanPayload {
    planCode: SubscriptionPlanCode;
  }
  ///subscriptions

  type SubscriptionPlanCode = "BASIC" | "ARTIST" | "ARTIST_PRO";

  type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELED" | "PENDING";

  interface ISubscriptionPlan {
    id: string;
    code: SubscriptionPlanCode;
    name: string;
    description: string;

    monthlyPrice: number;

    uploadMinutesLimit: number;
    unlimitedUploads: boolean;

    advancedInsightsDays: number;

    canDistribute: boolean;
    canMonetize: boolean;
    canScheduleRelease: boolean;
    hasMembershipBenefits: boolean;

    isActive: boolean;
  }

  interface IUserSubscription {
    id: string;
    status: SubscriptionStatus;

    startedAt?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;

    cancelAtPeriodEnd: boolean;
  }

  interface ISubscriptionUsage {
    uploadedSeconds: number;
    uploadedMinutes: number;

    limitMinutes: number;
    remainingMinutes: number;

    percentage: number;
    unlimited: boolean;
  }

  interface IArtistStudioStats {
    plays: number;
    reposts: number;
    downloads: number;
    likes: number;
    comments: number;
    earnings: number;
    fans: number;
  }

  type StudioTab =
    | "tracks"
    | "distribution"
    | "vinyl"
    | "comments"
    | "benefits";

  /// notifications
  interface INotification {
    id: string;
    recipientId: string;
    actorId?: string | null;

    type:
      | "NEW_FOLLOW"
      | "TRACK_LIKE"
      | "TRACK_COMMENT"
      | "TRACK_APPROVED"
      | "TRACK_REJECTED"
      | "COPYRIGHT_APPROVED"
      | "COPYRIGHT_REJECTED"
      | "TRACK_PROCESSING_COMPLETED"
      | "UPLOAD_QUOTA_WARNING"
      | "UPLOAD_QUOTA_EXCEEDED"
      | "SUBSCRIPTION_CHANGED"
      | "SUBSCRIPTION_CANCEL_SCHEDULED"
      | "SUBSCRIPTION_RENEWED"
      | "SUBSCRIPTION_EXPIRING"
      | "SYSTEM";

    title: string;
    message: string;

    entityType?:
      | "USER"
      | "TRACK"
      | "COMMENT"
      | "SUBSCRIPTION"
      | "SYSTEM"
      | null;

    entityId?: string | null;
    redirectUrl?: string | null;
    metadataJson?: string | null;

    isRead: boolean;
    readAt?: string | null;
    createdAt: string;
  }

  interface INotificationPage {
    content: INotification[];

    page: number;
    size: number;

    totalElements: number;
    totalPages: number;

    first: boolean;
    last: boolean;
  }

  interface IUnreadNotificationCount {
    unreadCount: number;
  }
  ///
}
