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

  type StudioTab =
    | "tracks"
    | "distribution"
    | "vinyl"
    | "comments"
    | "earnings"
    | "subscription"
    | "benefits";

  type SubscriptionTier = "FREE" | "ARTIST" | "ARTIST_PRO" | string;

  type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

  type ChatStatus = "ACTIVE" | "BANNED";

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

    /* =========================
       ACCOUNT STATUS
    ========================= */
    accountStatus?: AccountStatus;
    statusReason?: string | null;
    suspendedUntil?: string | null;
    statusUpdatedAt?: string | null;

    /* =========================
       CHAT STATUS
    ========================= */
    chatStatus?: ChatStatus;
    chatBanReason?: string | null;
    chatStatusUpdatedAt?: string | null;

    /**
     * Alias do Backend trả về.
     * true khi accountStatus === "DELETED".
     */
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

  interface UpdateMyProfilePayload {
    name?: string;
    website?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
    city?: string;
    country?: string;
    gender?: string;
    age?: number;
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

    /* AI COPYRIGHT RESULT */
    fingerprintAlgorithm?: string | null;
    fingerprintVersion?: string | null;
    fingerprintScore?: number | null;

    matchedDurationRatio?: number | null;
    matchedTrackId?: string | null;
    matchedTrackTitle?: string | null;

    copyrightRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | string | null;

    scannedAt?: string | null;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;

    image?: string;
    thumbnail?: string;
    audio?: string;
    audioUrl?: string;

    licenseUrl?: string | null;

    licenseFileName?: string | null;

    licenseFileSize?: number | null;

    licenseType?: TrackLicenseType | null;

    licenseNote?: string | null;

    licenseReviewStatus?: TrackLicenseReviewStatus | null;

    licenseReviewReason?: string | null;

    licenseUploadedAt?: string | null;

    licenseReviewedAt?: string | null;

    licenseReviewedBy?: string | null;
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
    sessionId?: string;
    playing?: boolean;
  };

  type CreateTrackPayload = {
    title: string;
    description: string;
    category: string;
    image: File;
    audio: File;

    license: File;
    licenseType: TrackLicenseType;
    licenseNote?: string;

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

    /*
     * =========================
     * MEMBERSHIP TRACK PREVIEW
     * =========================
     */

    membershipPreview?: boolean;

    membershipPreviewPostId?: string;

    previewStartSeconds?: number;

    /*
     * null hoặc undefined:
     * cho phép nghe hết track.
     */
    previewEndSeconds?: number;
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
    bio: string;
    role: string;
    avatarUrl?: string;
    avatar?: string;
    image?: string;
    picture?: string;
  };

  type UserAction =
    | "SUSPEND"
    | "ACTIVATE"
    | "DEACTIVATE"
    | "BAN_CHAT"
    | "ENABLE_CHAT";

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

    /* COPYRIGHT LICENSE */
    licenseFile: File | null;
    licenseFileName: string;
    licenseType:
      | ""
      | "ORIGINAL_OWNER"
      | "LICENSED"
      | "CREATIVE_COMMONS"
      | "PUBLIC_DOMAIN"
      | "OTHER";
    licenseNote: string;
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
    membership: number;
    downloads: number;
    likes: number;
    comments: number;
    earnings: number;
    fans: number;
  }

  interface IAiCopyrightResultDialogProps {
    open: boolean;
    track: ITrackTop | null;
    onClose: () => void;
  }

  /* =========================
   NOTIFICATIONS
========================= */

  type NotificationType =
    /* SOCIAL */
    | "NEW_FOLLOW"
    | "TRACK_LIKE"
    | "TRACK_COMMENT"

    /* TRACK */
    | "TRACK_APPROVED"
    | "TRACK_REJECTED"
    | "COPYRIGHT_APPROVED"
    | "COPYRIGHT_REJECTED"
    | "TRACK_PROCESSING_COMPLETED"

    /* UPLOAD QUOTA */
    | "UPLOAD_QUOTA_WARNING"
    | "UPLOAD_QUOTA_EXCEEDED"

    /* PAYMENT */
    | "PAYMENT_PAID"
    | "PAYMENT_FAILED"
    | "PAYMENT_CANCELED"
    | "PAYMENT_EXPIRED"

    /* SUBSCRIPTION */
    | "SUBSCRIPTION_ACTIVATED"
    | "SUBSCRIPTION_CHANGED"
    | "SUBSCRIPTION_CANCEL_SCHEDULED"
    | "SUBSCRIPTION_RENEWED"
    | "SUBSCRIPTION_EXPIRING"
    | "SUBSCRIPTION_EXPIRED"

    /* ARTIST EARNING */
    | "EARNING_AVAILABLE"

    /* ARTIST PAYOUT */
    | "PAYOUT_REQUESTED"
    | "PAYOUT_APPROVED"
    | "PAYOUT_REJECTED"
    | "PAYOUT_PAID"
    | "PAYOUT_CANCELED"

    /* SYSTEM */
    | "SYSTEM";

  type NotificationEntityType =
    | "USER"
    | "TRACK"
    | "COMMENT"
    | "PAYMENT"
    | "SUBSCRIPTION"
    | "EARNING"
    | "PAYOUT"
    | "SYSTEM";

  interface INotification {
    id: string;
    recipientId: string;
    actorId?: string | null;

    type: NotificationType;

    title: string;
    message: string;

    entityType?: NotificationEntityType | null;
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

  interface IUnreadNotificationCount {
    unreadCount: number;
  }

  /* =========================
   ARTIST EARNINGS & PAYOUT APIs
========================= */

  type ArtistEarningStatus = "PENDING" | "AVAILABLE" | "REJECTED" | "REVERSED";

  type ArtistPayoutStatus =
    | "PENDING"
    | "APPROVED"
    | "PAID"
    | "REJECTED"
    | "CANCELED";

  interface ArtistWalletData {
    id?: string;
    walletId?: string;
    artistId?: string;
    pendingBalance: number;
    availableBalance: number;
    reservedBalance: number;
    withdrawnBalance: number;
    lifetimeEarnings: number;
    currency: string;
    status: string;
  }

  interface ArtistEarningItem {
    id: string;
    listeningSessionId: string;
    listenerId: string;
    artistId: string;
    trackId: string;
    artistPlanCode: string;
    sourceType: string;
    amount: number;
    currency: string;
    status: ArtistEarningStatus;
    earningDate: string;
    qualifiedAt: string | null;
    availableAt: string | null;
    rejectionReason: string | null;
    releasedAt: string | null;
    reversedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface ArtistEarningHistoryData {
    current: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    status: ArtistEarningStatus | null;
    result: ArtistEarningItem[];
  }

  interface ArtistEarningSummaryData {
    wallet?: ArtistWalletData;
    pendingBalance?: number;
    availableBalance?: number;
    reservedBalance?: number;
    withdrawnBalance?: number;
    lifetimeEarnings?: number;
    pendingCount?: number;
    availableCount?: number;
    rejectedCount?: number;
    reversedCount?: number;
    totalItems?: number;
    currency?: string;
    [key: string]: unknown;
  }

  interface ArtistPayoutItem {
    id: string;
    artistId: string;
    walletId: string;
    amount: number;
    currency: string;
    payoutMethod: string;
    status: ArtistPayoutStatus;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    artistNote: string | null;
    adminNote: string | null;
    transactionReference: string | null;
    reviewedBy: string | null;
    requestedAt: string;
    reviewedAt: string | null;
    approvedAt: string | null;
    paidAt: string | null;
    rejectedAt: string | null;
    canceledAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface ArtistPayoutHistoryData {
    current: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    status: ArtistPayoutStatus | null;
    result: ArtistPayoutItem[];
  }

  interface ArtistPayoutActionData {
    payoutRequest: ArtistPayoutItem;
    walletId?: string;
    availableBalance: number | null;
    reservedBalance: number | null;
    withdrawnBalance: number | null;
    currency: string;
  }

  interface CreateArtistPayoutPayload {
    amount: number;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    artistNote?: string;
  }

  interface ApproveArtistPayoutPayload {
    adminNote?: string;
  }

  interface RejectArtistPayoutPayload {
    adminNote: string;
  }

  interface MarkArtistPayoutPaidPayload {
    adminNote?: string;
    transactionReference: string;
  }

  interface ArtistEarningQueryParams {
    status?: ArtistEarningStatus;
    current?: number;
    pageSize?: number;
  }

  interface ArtistPayoutQueryParams {
    status?: ArtistPayoutStatus;
    current?: number;
    pageSize?: number;
  }

  type WalletCard = {
    key: string;
    label: string;
    description: string;
    amount: number;
    icon: React.ReactNode;
  };

  /* =========================
   ADMIN ARTIST PAYOUT
========================= */

  interface IAdminArtistPayoutDialogProps {
    open: boolean;
    payout: ArtistPayoutItem | null;
    accessToken: string;

    onClose: () => void;

    onSuccess: (data: ArtistPayoutActionData) => void;
  }

  type AdminArtistPayoutAction = "APPROVE" | "REJECT" | "PAID";

  interface IAdminArtistPayoutFormData {
    adminNote: string;
    transactionReference: string;
  }

  interface IArtistSubscriptionManagerProps {
    data: IMySubscriptionData | null;
    accessToken: string;
    loading?: boolean;
    error?: string;
    onUpdated: (data: IMySubscriptionData) => void;
  }

  interface ISubscriptionInfoCardProps {
    label: string;
    value: string;
  }

  /* =========================
   ADMIN EARNING RATE TYPES
========================= */

  interface IEarningRate {
    id: string;
    amountPerStream: number;
    currency: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    status: "ACTIVE" | "INACTIVE" | "SCHEDULED";
    reason?: string | null;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface IEarningRateHistoryMeta {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  }

  interface IEarningRateHistoryData {
    meta: IEarningRateHistoryMeta;
    result: IEarningRate[];
  }

  interface CreateEarningRatePayload {
    amountPerStream: number;
    currency?: "VND";
    effectiveFrom?: string | null;
    reason?: string;
  }

  interface EarningRateQueryParams {
    current?: number;
    pageSize?: number;
  }

  /* =========================
   ADMIN EARNING RATE COMPONENT TYPES
========================= */

  interface EarningRatesTableProps {
    initialRates: IEarningRate[];
    initialActiveRate: IEarningRate | null;
    initialMeta: IEarningRateHistoryMeta;
    accessToken?: string;
  }

  /* =========================
   ADMIN TRACK LICENSE APIs
========================= */

  export const approveTrackLicenseApi = (id: string, accessToken?: string) => {
    return sendRequest<IBackendRes<ITrackTop>>({
      url: `/api/v1/admin/tracks/${encodeURIComponent(id)}/license/approve`,
      method: "PATCH",
      headers: authHeaders(accessToken),
    });
  };

  export const rejectTrackLicenseApi = (
    id: string,
    reason: string,
    accessToken?: string
  ) => {
    return sendRequest<IBackendRes<ITrackTop>>({
      url: `/api/v1/admin/tracks/${encodeURIComponent(id)}/license/reject`,
      method: "PATCH",
      body: {
        reason: reason.trim(),
      },
      headers: authHeaders(accessToken),
    });
  };

  type TrackLicenseType =
    | "ORIGINAL_OWNER"
    | "LICENSED"
    | "CREATIVE_COMMONS"
    | "PUBLIC_DOMAIN"
    | "OTHER";

  type TrackLicenseReviewStatus = "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

  /* =========================
   ADMIN PAYOUT TREND CHART
========================= */

  interface ArtistPayoutTrendPoint {
    monthKey: string;
    monthLabel: string;
    amount: number;
    payoutCount: number;
  }

  interface IArtistPayoutTrendChartProps {
    accessToken: string;
  }

  /// BADGES
  type BadgeCategory = "USER" | "ARTIST" | "ACHIEVEMENT" | "MEMBERSHIP";

  interface IBadge {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    iconUrl?: string | null;
    color?: string | null;
    category: BadgeCategory;
    active: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
  }

  interface IUserBadgeAwardedBy {
    id: string;
    name?: string | null;
  }

  interface IUserBadge {
    id: string;
    active: boolean;
    note?: string | null;
    awardedAt: string;
    expiresAt?: string | null;
    revokedAt?: string | null;
    badge: IBadge;
    awardedBy?: IUserBadgeAwardedBy | null;
  }

  interface IManageUserBadgesDialogProps {
    open: boolean;
    user: IUser | null;
    accessToken?: string;
    onClose: () => void;
  }

  /* =====================================================
   ARTIST MEMBERSHIP
===================================================== */

  type ArtistMembershipPostType = "TEXT" | "IMAGE" | "POLL" | "TRACK_PREVIEW";

  type ArtistMembershipVisibility = "PUBLIC" | "MEMBERS_ONLY" | "TIER_ONLY";

  type ArtistMembershipPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

  type ArtistMembershipSubscriptionStatus = "ACTIVE" | "CANCELED" | "EXPIRED";

  type ArtistMembershipPaymentStatus =
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "CANCELED"
    | "EXPIRED"
    | "REFUNDED";

  type ArtistMembershipCommentStatus = "ACTIVE" | "DELETED";

  type ArtistMembershipLockReason =
    | "MEMBERSHIP_REQUIRED"
    | "TIER_REQUIRED"
    | string;

  /* =====================================================
 MEMBERSHIP PLANS
===================================================== */

  interface IArtistMembershipPlan {
    id: string;
    artistId: string;

    code: string;
    name: string;
    description?: string | null;

    monthlyPrice: number;
    currency: string;

    badgeName: string;
    badgeColor: string;

    displayOrder: number;
    active: boolean;

    createdAt?: string | null;
    updatedAt?: string | null;
  }

  interface ICreateArtistMembershipPlanPayload {
    code: string;
    name: string;
    description?: string;

    monthlyPrice: number;

    badgeName: string;
    badgeColor: string;

    displayOrder?: number;
  }

  interface IUpdateArtistMembershipPlanPayload {
    name?: string;
    description?: string;

    monthlyPrice?: number;

    badgeName?: string;
    badgeColor?: string;

    displayOrder?: number;
    active?: boolean;
  }

  interface IProfileMembershipManagePlansDialogProps {
    open: boolean;
    accessToken?: string;
    onClose: () => void;
    onChanged?: () => void;
  }

  interface IProfileMembershipCreatePostDialogProps {
    open: boolean;
    accessToken?: string;
    onClose: () => void;
    onCreated?: () => void;
  }
  /* =====================================================
 MEMBERSHIP ACCESS
===================================================== */

  interface IArtistMembershipAccess {
    artistId: string;

    hasMembership: boolean;
    active: boolean;

    status?: ArtistMembershipSubscriptionStatus | null;

    subscriptionId?: string | null;
    memberId?: string | null;

    planId?: string | null;
    planCode?: string | null;
    planName?: string | null;

    badgeName?: string | null;
    badgeColor?: string | null;

    startedAt?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;

    cancelAtPeriodEnd: boolean;
  }

  interface IMyArtistMembership extends IArtistMembershipAccess {
    artistName?: string | null;
    artistUsername?: string | null;
    artistAvatarUrl?: string | null;

    latestPaymentId?: string | null;

    canceledAt?: string | null;
    expiredAt?: string | null;

    createdAt?: string | null;
    updatedAt?: string | null;
  }

  /* =====================================================
 MEMBERSHIP TRACK PREVIEW
===================================================== */

  interface IArtistMembershipTrackPreview {
    id: string;
    title: string;

    imgUrl?: string | null;
    trackUrl?: string | null;

    durationSeconds?: number | null;

    previewStartSeconds?: number | null;
    previewDurationSeconds?: number | null;
  }

  /* =====================================================
 MEMBERSHIP POLL
===================================================== */

  interface IArtistMembershipPollOption {
    id: string;
    text: string;

    displayOrder: number;

    voteCount: number;
    percentage: number;

    selected: boolean;
  }

  interface IArtistMembershipPoll {
    locked: boolean;
    lockReason?: ArtistMembershipLockReason | null;

    question?: string | null;

    options: IArtistMembershipPollOption[];

    totalVotes?: number | null;
    viewerOptionId?: string | null;
  }

  interface ICreateArtistMembershipPollPayload {
    visibility: ArtistMembershipVisibility;

    requiredPlanId?: string;

    question: string;

    options: string[];

    allowComments?: boolean;

    status?: Extract<ArtistMembershipPostStatus, "DRAFT" | "PUBLISHED">;
  }

  interface IVoteArtistMembershipPollPayload {
    optionId: string;
  }

  /* =====================================================
 MEMBERSHIP POSTS
===================================================== */

  interface IArtistMembershipPost {
    id: string;
    artistId: string;

    type: ArtistMembershipPostType;
    visibility: ArtistMembershipVisibility;

    requiredPlanId?: string | null;
    requiredPlanName?: string | null;

    requiredBadgeName?: string | null;
    requiredBadgeColor?: string | null;

    locked: boolean;
    lockReason?: ArtistMembershipLockReason | null;

    content?: string | null;
    imageUrl?: string | null;

    allowComments: boolean;

    status: ArtistMembershipPostStatus;

    track?: IArtistMembershipTrackPreview | null;
    poll?: IArtistMembershipPoll | null;

    commentCount?: number;

    publishedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }

  interface IArtistMembershipFeedData {
    current: number;
    pageSize: number;

    total: number;
    totalPages: number;

    items: IArtistMembershipPost[];
  }

  interface ICreateArtistMembershipPostPayload {
    type: Exclude<ArtistMembershipPostType, "IMAGE" | "POLL">;

    visibility: ArtistMembershipPostVisibility;

    requiredPlanId?: string;

    content?: string;

    trackId?: string;

    previewStartSeconds?: number;
    previewDurationSeconds?: number;

    allowComments?: boolean;

    status?: Extract<ArtistMembershipPostStatus, "DRAFT" | "PUBLISHED">;
  }

  interface IArtistMembershipPostPage {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: IArtistMembershipPost[];
  }

  interface IUpdateArtistMembershipPostPayload {
    visibility?: ArtistMembershipVisibility;

    requiredPlanId?: string;

    content?: string;

    trackId?: string;

    previewStartSeconds?: number;

    previewDurationSeconds?: number;

    allowComments?: boolean;

    status?: Extract<ArtistMembershipPostStatus, "DRAFT" | "PUBLISHED">;
  }

  interface IProfileMembershipManagePostsDialogProps {
    open: boolean;
    accessToken?: string;
    onClose: () => void;
    onChanged?: () => void;
  }

  interface IProfileMembershipEditPostDialogProps {
    open: boolean;

    post: IArtistMembershipPost | null;

    accessToken?: string;

    onClose: () => void;

    onUpdated?: () => void;
  }

  interface ICreateArtistMembershipImagePostPayload {
    visibility: ArtistMembershipVisibility;

    requiredPlanId?: string;

    content?: string;

    allowComments?: boolean;

    status?: Extract<ArtistMembershipPostStatus, "DRAFT" | "PUBLISHED">;

    image: File;
  }

  /* =====================================================
 MEMBERSHIP COMMENTS
===================================================== */

  interface IArtistMembershipCommentAuthor {
    id: string;

    name?: string | null;
    username?: string | null;
    avatarUrl?: string | null;

    type?: UserType | null;
  }

  interface IArtistMembershipPostComment {
    id: string;
    postId: string;

    parentCommentId?: string | null;

    author: IArtistMembershipCommentAuthor;

    content?: string | null;

    status: ArtistMembershipCommentStatus;

    deleted: boolean;
    edited: boolean;

    editedAt?: string | null;
    deletedAt?: string | null;

    replyCount: number;

    canEdit: boolean;
    canDelete: boolean;

    createdAt?: string | null;
    updatedAt?: string | null;
  }

  interface IArtistMembershipCommentPageData {
    current: number;
    pageSize: number;

    total: number;
    totalPages: number;

    items: IArtistMembershipPostComment[];
  }

  interface ICreateArtistMembershipCommentPayload {
    content: string;
    parentCommentId?: string;
  }

  interface IUpdateArtistMembershipCommentPayload {
    content: string;
  }

  /* =====================================================
 MEMBERSHIP PAGINATION
===================================================== */

  interface IArtistMembershipPaginationParams {
    current?: number;
    pageSize?: number;
  }

  /* =====================================================
   PROFILE MEMBERSHIP PLAN CARD
===================================================== */

  interface IProfileMembershipPlanCardProps {
    plan: IArtistMembershipPlan;

    membershipAccess?: IArtistMembershipAccess | null;

    isOwner?: boolean;
    loading?: boolean;

    onJoin?: (plan: IArtistMembershipPlan) => void;
  }
  /* =====================================================
   PROFILE MEMBERSHIP POST CARD
===================================================== */

  interface IProfileMembershipPostCardProps {
    post: IArtistMembershipPost;

    votingOptionId?: string | null;

    onVote?: (postId: string, optionId: string) => void | Promise<void>;

    onPlayTrack?: (
      track: IArtistMembershipTrackPreview,
      post: IArtistMembershipPost
    ) => void;

    onOpenComments?: (post: IArtistMembershipPost) => void;

    onJoinMembership?: (post: IArtistMembershipPost) => void;
  }
  /* =====================================================
   PROFILE MEMBERSHIP FEED
===================================================== */

  interface IProfileMembershipFeedProps {
    artistId: string;

    accessToken?: string;

    /*
     * Tăng giá trị này để tải lại feed,
     * ví dụ sau khi tạo hoặc xóa bình luận.
     */
    refreshKey?: number;

    onPlayTrack?: (
      track: IArtistMembershipTrackPreview,
      post: IArtistMembershipPost
    ) => void;

    onOpenComments?: (post: IArtistMembershipPost) => void;

    onJoinMembership?: (post: IArtistMembershipPost) => void;

    onRequireLogin?: () => void;
  }
  /* =====================================================
   PROFILE MEMBERSHIP COMMENTS DIALOG
===================================================== */

  interface IProfileMembershipCommentsDialogProps {
    open: boolean;

    post: IArtistMembershipPost | null;

    accessToken?: string;

    onClose: () => void;

    /*
     * Dùng để component cha tải lại feed
     * và cập nhật commentCount.
     */
    onCommentChanged?: (postId: string) => void;

    onRequireLogin?: () => void;
  }
  /* =====================================================
   MEMBERSHIP PAYMENT
===================================================== */

  interface ICreateArtistMembershipPaymentPayload {
    planId: string;

    bankCode?: string;
    locale?: "vn" | "en";
  }

  interface IArtistMembershipPayment {
    paymentId: string;
    orderCode: string;

    provider: string;

    memberId: string;
    artistId: string;
    planId: string;

    planCode?: string | null;
    planName?: string | null;

    badgeName?: string | null;
    badgeColor?: string | null;

    periodDays: number;

    grossAmount: number;
    platformFeePercent: number;
    platformFeeAmount: number;
    artistNetAmount: number;

    currency: string;

    status: ArtistMembershipPaymentStatus;

    subscriptionId?: string | null;
    paymentUrl?: string | null;

    responseCode?: string | null;
    transactionStatus?: string | null;

    paidAt?: string | null;
    expiresAt?: string | null;
    createdAt?: string | null;

    reused: boolean;
  }

  /* =====================================================
   PROFILE MEMBERSHIP TAB
===================================================== */

  interface IProfileMembershipTabProps {
    artistId: string;

    artistName?: string;

    accessToken?: string;

    isOwner?: boolean;

    onRequireLogin?: () => void;

    onOpenPlans?: () => void;

    onPlayTrack?: (
      track: IArtistMembershipTrackPreview,
      post: IArtistMembershipPost
    ) => void;
  }

  interface IProfileMembershipPlansDialogProps {
    open: boolean;
    artistId: string;
    artistName: string;
    accessToken?: string;
    isOwner?: boolean;
    onClose: () => void;
    onRequireLogin?: () => void;
  }

  // ============================================
  // ARTIST TICKETING
  // ============================================

  type ArtistEventType = "CONCERT" | "TOUR" | "FAN_MEETING" | "OTHER";

  type ArtistEventSaleStatus =
    | "UPCOMING"
    | "ON_SALE"
    | "SOLD_OUT"
    | "SALE_ENDED"
    | "ENDED"
    | "CANCELLED";

  type ArtistEventApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

  interface IArtistEvent {
    id: string;
    artistId: string;

    eventName: string;
    eventType: ArtistEventType;

    description?: string | null;

    venueName: string;
    venueAddress: string;

    eventStartAt: string;
    eventEndAt?: string | null;

    saleStartAt: string;
    saleEndAt: string;

    ticketPrice: number;
    currency: string;

    totalQuantity: number;
    soldQuantity: number;
    remainingQuantity: number;

    ticketImageUrl: string;

    saleStatus: ArtistEventSaleStatus;
    canPurchase: boolean;
  }

  interface IArtistEventPage {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: IArtistEvent[];
  }

  // ============================================
  // ARTIST EVENT MANAGEMENT
  // ============================================

  interface IArtistManagedEvent extends IArtistEvent {
    reservedQuantity?: number;

    approvalStatus: ArtistEventApprovalStatus;

    rejectionReason?: string | null;

    reviewedBy?: string | null;
    reviewedAt?: string | null;

    status: "ACTIVE" | "CANCELLED" | "ENDED";

    createdAt: string;
    updatedAt: string;
  }

  interface IArtistManagedEventPage {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: IArtistManagedEvent[];
  }

  interface ICreateArtistEventPayload {
    eventName: string;
    eventType: ArtistEventType;

    description?: string;

    venueName: string;
    venueAddress: string;

    eventStartAt: string;
    eventEndAt?: string;

    saleStartAt: string;
    saleEndAt: string;

    ticketPrice: number;
    totalQuantity: number;

    ticketImage: File;
  }

  // ============================================
  // TICKET PAYMENT
  // ============================================

  type TicketPaymentStatus =
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "CANCELED"
    | "EXPIRED"
    | "REFUNDED";

  interface ICreateTicketPaymentPayload {
    eventId: string;
    quantity: number;

    locale?: "vn" | "en";
    bankCode?: string;
  }

  interface ITicketPayment {
    paymentId: string;
    orderCode: string;

    provider: "VNPAY";

    buyerId: string;
    artistId: string;
    eventId: string;

    eventName: string;

    ticketImageUrl?: string | null;

    quantity: number;

    unitPrice: number;
    grossAmount: number;

    platformFeePercent: number;
    platformFeeAmount: number;

    artistNetAmount: number;

    currency: string;

    status: TicketPaymentStatus;

    inventoryReserved: boolean;

    primaryTicketId?: string | null;

    paymentUrl?: string | null;

    responseCode?: string | null;
    transactionStatus?: string | null;

    paidAt?: string | null;
    expiresAt?: string | null;

    createdAt: string;

    reused?: boolean;
  }

  // ============================================
  // USER TICKET COLLECTION
  // ============================================

  type UserEventTicketStatus = "VALID" | "USED" | "CANCELLED";

  type UserEventTicketCollectionStatus =
    | "UPCOMING"
    | "PAST"
    | "USED"
    | "CANCELLED";

  interface IUserEventTicket {
    id: string;

    ticketCode: string;

    eventId: string;
    artistId: string;

    eventName: string;

    venueName: string;
    venueAddress: string;

    eventStartAt: string;

    ticketImageUrl: string;

    purchasePrice: number;
    currency: string;

    status: UserEventTicketStatus;

    collectionStatus: UserEventTicketCollectionStatus;

    purchasedAt: string;

    checkedInAt?: string | null;
  }

  interface IUserEventTicketPage {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: IUserEventTicket[];
  }

  interface IUserEventTicketQr {
    ticketId: string;
    ticketCode: string;

    eventId: string;
    eventName: string;

    status: UserEventTicketStatus;

    qrValue: string;
  }

  // ============================================
  // TICKET CHECK-IN
  // ============================================

  interface ICheckInTicketPayload {
    qrToken: string;
  }

  // ============================================
  // PROFILE CONCERTS / TOUR
  // ============================================

  interface IProfileConcertsTabProps {
    artistId: string;
    artistName?: string;
    accessToken?: string;
    isOwner?: boolean;
    onRequireLogin?: () => void;
  }

  // ============================================
  // CREATE ARTIST EVENT DIALOG
  // ============================================

  interface IProfileCreateArtistEventDialogProps {
    open: boolean;
    accessToken?: string;
    onClose: () => void;
    onCreated?: () => void;
  }
  // ============================================
  // MANAGE ARTIST EVENTS DIALOG
  // ============================================

  interface IProfileManageArtistEventsDialogProps {
    open: boolean;
    accessToken?: string;
    onClose: () => void;
  }
  // ============================================
  // ADMIN TICKET EVENT MODERATION
  // ============================================

  interface IAdminArtistEvent extends IArtistManagedEvent {
    artistName?: string | null;
    artistUsername?: string | null;
    artistEmail?: string | null;
  }

  interface IAdminArtistEventPage {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: IAdminArtistEvent[];
  }

  interface IRejectArtistEventPayload {
    reason: string;
  }
  // ============================================
  // PROFILE TICKET COLLECTION
  // ============================================

  interface IProfileTicketsTabProps {
    accessToken?: string;
  }

  interface IProfileTicketQrDialogProps {
    open: boolean;
    ticket: IUserEventTicket | null;
    accessToken?: string;
    onClose: () => void;
  }

  // ============================================
  // TICKET CHECK-IN DIALOG
  // ============================================

  interface ITicketCheckInDialogProps {
    open: boolean;
    accessToken?: string;
    onClose: () => void;
  }
  /* =====================================================
===================================================== */
}
