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
    name: string;
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
  ///
}
