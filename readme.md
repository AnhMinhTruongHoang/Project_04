# HƯỚNG DẪN BÀN GIAO SOUNDCLOUD CLONE

> Backend Spring Boot · Frontend Next.js · MySQL · Postman

**Ngày cập nhật:** 15/07/2026

**Lưu ý:** Đây là bản Markdown dùng đưa vào repository. Bản DOCX có định dạng bảng và bố cục đầy đủ hơn.

HƯỚNG DẪN BÀN GIAOSOUNDCLOUD CLONE

Backend Spring Boot · Frontend Next.js · MySQL · Postman

TÀI LIỆU DÀNH CHO THÀNH VIÊN TIẾP NHẬN VÀ PHÁT TRIỂN CÁC PHẦN CÒN LẠI

| Tên dự án | Project 04 – SoundCloud Clone |
| --- | --- |
| Trạng thái bàn giao | Phần lõi đã hoạt động; Notification mới hoàn tất core + trigger Comment |
| Phạm vi tài liệu | Cài đặt, kiến trúc, file, API, module đã xong, việc tiếp theo, kiểm thử và quy trình Git |
| Ngày cập nhật | 15/07/2026 |
| Mức độ ưu tiên | Đọc toàn bộ Mục 1–10 trước khi sửa code |

> CẢNH BÁO QUAN TRỌNGKhông đổi endpoint, DTO hoặc cấu trúc response chỉ để “chạy tạm”. Trước khi sửa phải tìm tất cả nơi FE đang gọi API, kiểm tra Postman collection và xác định một endpoint chuẩn duy nhất. Đặc biệt chú ý Follow, Like, Playlist và route Track vì dự án từng có endpoint cũ song song endpoint mới.

## MỤC LỤC NỘI DUNG

- 1. Cách sử dụng tài liệu và nguyên tắc bàn giao
- 2. Tổng quan hệ thống và trạng thái hiện tại
- 3. Cài đặt môi trường phát triển từ máy mới
- 4. Kiến trúc thư mục và trách nhiệm từng lớp
- 5. Quy ước code bắt buộc của dự án
- 6. Postman, biến môi trường và kiểm thử API
- 7. Các module đã hoàn thành và cách kiểm tra
- 8. Module Notification – trạng thái bàn giao chi tiết
- 9. Các part Notification cần làm tiếp
- 10. Các part Artist Studio và thương mại cần làm tiếp
- 11. Các lỗi kỹ thuật tồn đọng cần xử lý
- 12. Kế hoạch database và migration
- 13. Chiến lược test và Definition of Done
- 14. Quy trình Git/GitHub và bảo mật
- 15. Phân công công việc đề xuất cho nhóm
- 16. Checklist tiếp nhận trong ngày đầu tiên
- 17. Troubleshooting thường gặp
- 18. Phụ lục API hiện có trong Postman
- 19. Phụ lục sơ đồ file cần biết
> CÁCH ĐỌC NHANHNgười phụ trách Backend đọc Mục 3, 4, 5, 8, 9, 11, 12, 13. Người phụ trách Frontend đọc Mục 3, 4, 5, 8, 10, 11, 13. Người phụ trách QA/Postman đọc Mục 6, 13, 16, 18.

## 1. CÁCH SỬ DỤNG TÀI LIỆU VÀ NGUYÊN TẮC BÀN GIAO

Tài liệu này là điểm bắt đầu duy nhất cho thành viên mới. Không nên bắt đầu bằng cách sửa trực tiếp một lỗi trên giao diện trước khi hiểu luồng dữ liệu từ Entity → Repository → Service → Controller → api.ts → Component/Page.

### 1.1. Quy tắc trước khi nhận một task

1. Đọc mô tả task và xác định task thuộc Backend, Frontend, Database hay tích hợp end-to-end.

2. Tìm endpoint hiện đang được FE gọi trong src/utils/api.ts.

3. Tìm controller đang map endpoint bằng Ctrl + Shift + F với chuỗi @RequestMapping, @GetMapping, @PostMapping, @PatchMapping hoặc @DeleteMapping.

4. Kiểm tra xem có endpoint trùng hoặc endpoint cũ cùng chức năng hay không.

5. Đọc Entity và Repository liên quan trước khi chỉnh Controller.

6. Chỉ sửa đúng phần cần thiết; không đổi tên field API khi chưa cập nhật toàn bộ FE, Postman và dữ liệu.

7. Sau khi sửa: build BE, build FE, test Postman, test UI và ghi lại thay đổi trong commit.

### 1.2. Phân loại trạng thái trong tài liệu

- Đã hoàn thành: code lõi đã có và từng được kiểm tra hoạt động.
- Gần hoàn thành: code đã nối nhưng vẫn cần test runtime hoặc còn một số trigger phụ.
- Chưa làm: chỉ có UI placeholder hoặc chưa có bảng/API thật.
- Cần xác minh: tên file/endpoint có thể đã thay đổi; phải search trong repo trước khi sửa.
## 2. TỔNG QUAN HỆ THỐNG VÀ TRẠNG THÁI HIỆN TẠI

### 2.1. Công nghệ

| Tầng | Công nghệ chính | Vai trò |
| --- | --- | --- |
| Frontend | Next.js App Router, TypeScript, MUI, NextAuth, WaveSurfer | UI dark mode, auth session, phát nhạc, gọi REST API |
| Backend | Spring Boot, Jakarta, JPA/Hibernate, JWT | REST API, nghiệp vụ, phân quyền, transaction |
| Database | MySQL | User, Track, Comment, Follow, Playlist, Subscription, Notification… |
| Kiểm thử API | Postman Collection v2.1 | 90 request đã chuẩn hóa bằng biến {{baseUrl}}, {{accessToken}}, {{adminToken}} |

### 2.2. Bảng trạng thái bàn giao

| Hạng mục | Trạng thái | Mức hoàn thiện | Ghi chú bàn giao |
| --- | --- | --- | --- |
| Authentication/User cơ bản | Đã có | 80–90% | Đăng nhập, đăng ký, account và các flow OTP/password có trong Postman; cần giữ thống nhất token/session. |
| Track upload/play/history | Đã có | 85–90% | Upload multipart, SHA-256 chống trùng, play count và listening history đã triển khai. |
| Profile/Leaderboard/Who to follow | Đã có | 80–90% | Còn một số lỗi hiển thị track, following và owner permission cần kiểm tra. |
| Playlist | Gần hoàn thành | 75–85% | CRUD đã có; phải xác minh endpoint chuẩn, đặc biệt create empty/my-playlists. |
| Artist Studio core | Đã có | 80–90% | Stats, tracks, quota, subscription và benefits có API thật. |
| Subscription | Đã có core | 80–90% | BASIC/ARTIST/ARTIST_PRO; chưa có payment thật và renewal scheduler hoàn chỉnh. |
| Notification core | Gần hoàn thành | 85–90% | CRUD/read state/page UI đã có; mới gắn trigger Comment. |
| Distribution/Vinyl/Comments workspace | Chưa làm | 0–20% | Hiện là tab hoặc ý tưởng, chưa có domain/API đầy đủ. |
| Reposts/Downloads/Earnings | Chưa làm | 0–15% | Stats đang trả 0 do chưa có module dữ liệu. |

### 2.3. Nguồn sự thật khi có mâu thuẫn

- Ưu tiên 1: code Controller/Service đang build và chạy trong nhánh chính.
- Ưu tiên 2: src/utils/api.ts của FE, vì đây là endpoint UI đang gọi.
- Ưu tiên 3: Postman collection bản UPDATED_FULL hoặc PUBLIC_SAFE.
- Không lấy endpoint từ tài liệu cũ nếu code hiện tại đã thay đổi.
## 3. CÀI ĐẶT MÔI TRƯỜNG PHÁT TRIỂN TỪ MÁY MỚI

### 3.1. Chuẩn bị

- JDK đúng phiên bản dự án và Maven/Gradle tương ứng với repository.
- Node.js LTS phù hợp package-lock.json; dùng npm nếu repo đang dùng package-lock.json.
- MySQL Server và công cụ quản lý như MySQL Workbench.
- Git, VS Code/IntelliJ, Postman.
- Không lấy file .env hoặc mật khẩu từ GitHub public. Xin trực tiếp từ người quản lý dự án.
### 3.2. Khởi động Backend

1. Clone repository và checkout đúng nhánh làm việc.

2. Mở thư mục BE, kiểm tra application.properties hoặc application.yml.

3. Tạo database MySQL theo tên cấu hình; import seed/migration nếu repo có.

4. Cấu hình DB username/password ở file local không commit hoặc bằng biến môi trường.

5. Chạy mvn clean test hoặc ./mvnw clean test.

6. Chạy Spring Boot và xác nhận server ở http://localhost:8000.

7. Gọi GET/POST auth bằng Postman để kiểm tra kết nối DB và JWT.

```text
# Ví dụ lệnh Mavencd BE./mvnw clean test./mvnw spring-boot:run# Windows PowerShell có thể dùngmvnw.cmd clean testmvnw.cmd spring-boot:run
```

### 3.3. Khởi động Frontend

1. Mở thư mục FE.

2. Chạy npm install đúng theo package-lock.json.

3. Tạo .env.local từ .env.example nếu có.

4. Đặt NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 và cấu hình NextAuth cần thiết.

5. Chạy npm run dev.

6. Đăng nhập, mở Network tab và xác nhận request có Authorization: Bearer token.

```text
cd FEnpm installnpm run dev# Trước khi mergenpm run lintnpm run build
```

### 3.4. Kiểm tra nhanh sau khi khởi động

| ☐ | Backend không có lỗi schema/duplicate mapping. |
| --- | --- |
| ☐ | Frontend không có lỗi TypeScript. |
| ☐ | Login thành công và session chứa access token. |
| ☐ | Trang Home tải được track. |
| ☐ | Footer player phát được audio. |
| ☐ | Postman lấy được /api/v1/auth/account. |
| ☐ | MySQL có dữ liệu User và Track. |

## 4. KIẾN TRÚC THƯ MỤC VÀ TRÁCH NHIỆM TỪNG LỚP

### 4.1. Backend – cấu trúc khuyến nghị đang sử dụng

```text
BE/src/main/java/com/example/demo/├── controllers/      # Nhận request, auth, validate cấp HTTP, trả ApiResponse├── services/         # Nghiệp vụ, transaction, gọi nhiều repository├── repositories/     # JPA query, không nhét logic nghiệp vụ├── entities/         # Mapping bảng MySQL├── dtos/             # Request/response model├── responses/        # ApiResponse<T> và response dùng chung├── types/ hoặc enums/# NotificationType, status, entity type├── helpers/          # JwtHelper, utility kỹ thuật└── configs/          # Security, static resources, CORS…
```

Quy tắc: Controller không nên chứa quá nhiều nghiệp vụ. Với module mới, ưu tiên tạo Service. Riêng Comment hiện đang được tạo trực tiếp trong TrackController; đây là code cũ đang hoạt động, nhưng khi mở rộng moderation/reply nên tách sang CommentService.

### 4.2. Frontend – các vùng cần biết

```text
FE/src/├── app/                         # Next.js App Router│   ├── (user)/                  # Route dành cho user│   │   ├── notifications/│   │   ├── artist-studio/│   │   ├── plans/│   │   └── profile/...│   └── (admin)/dashboard/       # Route quản trị├── components/                  # Header, player, card, shared UI├── lib/                         # TrackContext, session wrapper├── utils/│   ├── api.ts                   # Toàn bộ client REST API│   └── actions/getImages...     # Chuẩn hóa URL ảnh└── types hoặc global.d.ts       # Interface global như INotification
```

### 4.3. Luồng dữ liệu chuẩn

```text
MySQL  ↓Entity  ↓Repository  ↓Service (@Transactional)  ↓Controller + ApiResponse<T>  ↓src/utils/api.ts  ↓Page/Component  ↓State UI + toast/loading/error
```

> KHÔNG LÀMKhông gọi fetch trực tiếp rải rác trong component nếu đã có sendRequest/api.ts. Không trả Entity thẳng ra ngoài nếu Entity có field nhạy cảm hoặc quan hệ gây vòng lặp JSON. Không sửa response shape chỉ ở một phía.

## 5. QUY ƯỚC CODE BẮT BUỘC CỦA DỰ ÁN

### 5.1. Backend

- Dùng java.time.LocalDateTime cho createdAt/updatedAt; không quay lại java.util.Date hoặc @Temporal.
- Mọi thao tác nhiều bước ghi DB phải nằm trong Service có @Transactional.
- Không để notification hoặc side-effect phụ làm hỏng hành động chính nếu nghiệp vụ không yêu cầu rollback; có thể bọc try/catch có log.
- Kiểm tra quyền sở hữu trước update/delete track, playlist, notification.
- Không tạo hai controller cùng map một endpoint. Follow từng bị lỗi Ambiguous handler methods.
- Dùng ApiResponse<T> thống nhất statusCode, message, data.
- Không log access token, refresh token, password hoặc OTP.
### 5.2. Frontend

- Toàn bộ UI phải dark mode thật: text, disabled state, dialog, table, tooltip, skeleton và hover phải có độ tương phản.
- Global interface không cần import type nếu dự án đã khai báo trong global.d.ts.
- currentTrack có kiểu IShareTrack | null; luôn dùng optional chaining hoặc guard trước khi đọc _id/isPlaying.
- API headers phải đúng Record<string, string>; không tạo object union có Authorization: undefined.
- Loading auth phải được xử lý để tránh nút Login nháy lại khi session đang loading.
- Không hardcode backend URL; dùng NEXT_PUBLIC_BACKEND_URL hoặc helper URL.
### 5.3. Quy ước sửa lỗi TypeScript

```text
// Đúngconst currentTrackId = currentTrack?._id || currentTrack?.id || "";const isPlaying = Boolean(  currentTrack?.isPlaying && currentTrackId === trackId);// Không khuyến nghịconst id = currentTrack!._id; // chỉ tắt cảnh báo, có thể lỗi runtime
```

## 6. POSTMAN, BIẾN MÔI TRƯỜNG VÀ KIỂM THỬ API

Collection đã được chuẩn hóa thành 90 request, chia theo module và dùng biến. Bản PUBLIC_SAFE có thể push GitHub; bản chạy thực tế không được commit sau khi đã chứa token.

### 6.1. Biến cần tạo trong Postman Environment

| Biến | Ví dụ local | Quy tắc |
| --- | --- | --- |
| baseUrl | http://localhost:8000 | Có thể commit nếu chỉ là localhost. |
| accessToken |  | Không commit giá trị thật. |
| adminToken |  | Không commit giá trị thật. |
| refreshToken |  | Không commit giá trị thật. |
| userId/trackId/... |  | Có thể để ID seed mẫu không nhạy cảm; tốt nhất để trống. |
| email/password/otp |  | Không commit tài khoản hoặc OTP thật. |

### 6.2. Trình tự test end-to-end

1. Login User và xác nhận script Postman lưu accessToken.

2. Login Admin và xác nhận adminToken.

3. Tạo hoặc chọn track của User A.

4. Dùng token User B thực hiện like/comment/follow.

5. Quay lại token User A và kiểm tra unread-count, notification list.

6. Đánh dấu read, xóa và clear-read.

7. Kiểm tra trực tiếp bảng MySQL khi response không đúng.

### 6.3. Quy tắc cập nhật collection

- Mỗi endpoint mới phải thêm vào đúng folder module.
- Dùng {{baseUrl}} và biến ID; không dùng URL localhost hardcode ở từng request.
- Thêm body mẫu đúng DTO thật.
- Không thêm endpoint giả cho module chưa có backend.
- Sau khi sửa collection, export bản public-safe trước khi push GitHub.
## 7. CÁC MODULE ĐÃ HOÀN THÀNH VÀ CÁCH KIỂM TRA

### 7.1. Listening History và đề xuất Home

```text
POST /api/v1/tracks/{trackId}/historyGET  /api/v1/tracks/history/home?limit=10GET  /api/v1/tracks/because-you-listened?limit=10GET  /api/v1/tracks/hidden-gems?limit=10&maxPlays=1000
```

- Khi user nghe track, FE phải gọi history sau ngưỡng hợp lý, tránh gọi liên tục mỗi lần render.
- Kiểm tra DB có row history mới và không tạo spam row ngoài thiết kế.
- Home phải hiển thị data API thật, không fallback hardcoded khi API trả rỗng.
### 7.2. Who to Follow

```text
GET /api/v1/users/who-to-follow?limit=12
```

Trang /people và danh sách gợi ý đã có. Khi chỉnh thuật toán, phải loại chính user hiện tại, người đã follow và tài khoản bị xóa/khóa.

### 7.3. Artist Studio core

```text
GET /api/v1/artist-studio/statsGET /api/v1/artist-studio/benefitsGET /api/v1/tracks/my-tracks
```

- Stats thật: plays, likes, comments, fans.
- reposts, downloads, earnings đang bằng 0 vì chưa có module.
- Benefits lấy từ DB; Admin có CRUD và ảnh /uploads/benefits/...
- AI Mastering đã loại khỏi scope hiện tại.
### 7.4. Subscription core

```text
GET  /api/v1/subscriptions/plansGET  /api/v1/subscriptions/meGET  /api/v1/subscriptions/me/usagePOST /api/v1/subscriptions/subscribePOST /api/v1/subscriptions/change-planPOST /api/v1/subscriptions/cancel
```

- BASIC: miễn phí, 180 phút upload, insights 7 ngày.
- ARTIST: 49.000đ/tháng, 600 phút, insights 30 ngày, distribution + schedule.
- ARTIST_PRO: 99.000đ/tháng, unlimited, advanced insights, monetization và benefits.
- Usage được giữ khi đổi plan; upload quota dùng transaction/lock để tránh race condition.
## 8. MODULE NOTIFICATION – TRẠNG THÁI BÀN GIAO CHI TIẾT

### 8.1. Backend files

```text
src/main/java/com/example/demo/├── entities/Notification.java├── repositories/NotificationRepository.java├── services/NotificationService.java├── controllers/NotificationController.java├── dtos/NotificationCreateDTO.java├── dtos/NotificationDTO.java├── dtos/NotificationPageDTO.java├── dtos/UnreadNotificationCountDTO.java└── types/NotificationType.java   types/NotificationEntityType.java
```

### 8.2. API hiện có

```text
GET    /api/v1/notifications?page=0&size=20&status=allGET    /api/v1/notifications?page=0&size=20&status=unreadGET    /api/v1/notifications/unread-countPATCH  /api/v1/notifications/{notificationId}/readPATCH  /api/v1/notifications/read-allDELETE /api/v1/notifications/{notificationId}DELETE /api/v1/notifications/clear-read
```

### 8.3. Frontend files

```text
src/utils/api.ts  - getNotificationsApi  - getUnreadNotificationCountApi  - markNotificationAsReadApi  - markAllNotificationsAsReadApi  - deleteNotificationApi  - clearReadNotificationsApisrc/components/header/notificationBell.tsx   # hoặc vị trí Header thực tếsrc/app/(user)/notifications/page.tsxglobal.d.ts                                  # INotification...
```

### 8.4. Flow Comment đã gắn

Nơi gọi đúng là method tạo comment trong TrackController, không phải CommentController admin.

```text
@PostMapping("/{trackId}/comments")public ResponseEntity<?> createComment(...) {    ...    Comment savedComment = commentRepository.save(comment);    try {        notificationService.notifyTrackComment(            user,            track,            savedComment        );    } catch (Exception notificationError) {        System.err.println(            "Cannot create comment notification: "            + notificationError.getMessage()        );    }    ...}
```

- User B comment track User A → User A nhận TRACK_COMMENT.
- Chủ track tự comment → không tạo notification.
- Dedup key: TRACK_COMMENT:{commentId}.
- Comment vẫn thành công nếu notification lỗi vì notification là side-effect phụ.
### 8.5. UI hiện có

- Badge unread trên icon chuông.
- Popover giống SoundCloud, danh sách có maxHeight và overflowY:auto.
- Mark one read, mark all read, điều hướng redirectUrl.
- Trang /notifications có All/Unread, refresh, delete, clear read, load more.
- Switch On/Off hiện chỉ lưu localStorage; chưa phải user setting trên backend.
> ĐIỂM PHẢI TEST NGAYDùng hai tài khoản khác nhau. User B comment track của User A, sau đó đăng nhập User A và kiểm tra bảng notifications, /unread-count, popup, page /notifications và redirectUrl. Chưa test runtime thì không đánh dấu module 100%.

## 9. CÁC PART NOTIFICATION CẦN LÀM TIẾP

### 9.1. Bước 0 – xác minh runtime Comment

| ☐ | Bảng notifications tồn tại và đúng schema. |
| --- | --- |
| ☐ | Comment của user khác tạo đúng 1 notification. |
| ☐ | Self-comment không tạo notification. |
| ☐ | Unread count tăng và giảm đúng. |
| ☐ | Mark all, delete, clear read hoạt động. |
| ☐ | redirectUrl mở đúng route track hiện tại. |

### 9.2. Trigger NEW_FOLLOW

File cần tìm: controller/service đang xử lý POST /api/v1/users/{targetUserId}/follow. Dự án từng có FollowController và UserController cùng map endpoint; trước tiên phải giữ một implementation duy nhất.

1. Search toàn repo chuỗi /follow và @PostMapping.

2. Chọn controller/service chuẩn; xóa hoặc đổi route implementation trùng.

3. Inject NotificationService vào service tạo UserFollow.

4. Sau khi save follow thành công, gọi notifyNewFollow(actor, targetUser).

5. Không tạo khi actor follow chính mình.

6. Không tạo lại nếu quan hệ follow đã tồn tại.

7. Unfollow không bắt buộc xóa lịch sử notification; re-follow có thể reactivate cùng dedup key.

```text
// Thêm vào NotificationService@Transactionalpublic NotificationDTO notifyNewFollow(User actor, User target) {    NotificationCreateDTO request = new NotificationCreateDTO();    request.setRecipientId(target.getId());    request.setActorId(actor.getId());    request.setType(NotificationType.NEW_FOLLOW);    request.setTitle("New follower");    request.setMessage(displayName(actor) + " followed you");    request.setEntityType(NotificationEntityType.USER);    request.setEntityId(actor.getId());    request.setRedirectUrl("/profile/" + actor.getId());    request.setDeduplicationKey(        "NEW_FOLLOW:" + actor.getId() + ":" + target.getId()    );    return create(request);}
```

### 9.3. Trigger TRACK_LIKE

Endpoint chuẩn nên là POST /api/v1/tracks/{trackId}/like và POST /dislike hoặc DELETE /like. Collection cũ từng có /api/v1/likes; không duy trì hai flow song song nếu cùng nghiệp vụ.

1. Xác định method thực sự tạo row like và tăng countLike.

2. Chỉ tạo notification khi trạng thái chuyển từ chưa like → liked.

3. Unlike không tạo notification.

4. Không notify khi uploader tự like track.

5. Dedup key theo track + actor để re-like không tạo vô hạn bản ghi.

```text
TRACK_LIKE:{trackId}:{actorId}recipientId = track.uploaderIdactorId     = user hiện tạientityType  = TRACKentityId    = trackIdredirectUrl = route track thật
```

### 9.4. Track Approved/Rejected và Copyright

File cần tìm trong admin controller/service xử lý PATCH /api/v1/admin/tracks/{trackId}/approve và /reject.

- Sau khi cập nhật status và save thành công, gửi notification cho uploader.
- Rejected phải đưa rejectionReason vào message hoặc metadataJson.
- Copyright rejected/approved dùng type riêng nếu backend có bước kiểm duyệt bản quyền.
- Processing completed chỉ gửi khi trạng thái thực sự chuyển sang completed.
### 9.5. Subscription và Upload Quota

- SUBSCRIPTION_CHANGED: gọi sau subscribe/change-plan thành công.
- SUBSCRIPTION_CANCEL_SCHEDULED: gọi khi user chọn cancel at period end.
- SUBSCRIPTION_RENEWED: gọi từ scheduler/payment webhook sau gia hạn thật.
- SUBSCRIPTION_EXPIRING: scheduler chạy hằng ngày, chỉ gửi một lần cho mỗi period.
- UPLOAD_QUOTA_WARNING: gửi ở mốc 80% và 95%, dùng dedup key khác nhau.
- UPLOAD_QUOTA_EXCEEDED: gửi khi request upload bị chặn do hết quota.
```text
UPLOAD_QUOTA_WARNING_80:{subscriptionId}:{periodStart}UPLOAD_QUOTA_WARNING_95:{subscriptionId}:{periodStart}UPLOAD_QUOTA_EXCEEDED:{subscriptionId}:{periodStart}
```

### 9.6. Notification Settings thật trên Backend

Switch hiện tại chỉ tắt việc gọi API ở trình duyệt. Để đồng bộ nhiều thiết bị, cần lưu setting server-side.

```text
Đề xuất bảng user_notification_settings- id- user_id UNIQUE- enabled- notify_follow- notify_like- notify_comment- notify_track_status- notify_subscription- created_at- updated_atAPI đề xuất:GET   /api/v1/users/me/notification-settingsPATCH /api/v1/users/me/notification-settings
```

1. Tạo Entity/Repository/DTO/Service/Controller.

2. NotificationService kiểm tra setting trước khi create.

3. Frontend switch đọc setting khi mount và PATCH khi đổi.

4. LocalStorage chỉ dùng cache UI, không phải nguồn sự thật.

### 9.7. Real-time notification – tùy chọn sau cùng

Hiện FE polling unread count mỗi 60 giây là đủ cho MVP. Chỉ triển khai SSE/WebSocket sau khi toàn bộ trigger ổn định. SSE đơn giản hơn WebSocket cho luồng server → client một chiều.

## 10. CÁC PART ARTIST STUDIO VÀ THƯƠNG MẠI CẦN LÀM TIẾP

### 10.1. Distribution

Mục tiêu: artist gửi track/album để phân phối. Không tích hợp distributor bên ngoài ngay; làm domain nội bộ trước.

```text
Backend files đề xuất:entities/DistributionSubmission.javarepositories/DistributionSubmissionRepository.javaservices/DistributionService.javacontrollers/DistributionController.javadtos/CreateDistributionSubmissionDTO.javadtos/DistributionSubmissionDTO.javatypes/DistributionStatus.javaAPI đề xuất:POST /api/v1/distribution/submissionsGET  /api/v1/distribution/submissions/meGET  /api/v1/distribution/submissions/{id}PATCH /api/v1/admin/distribution/submissions/{id}/status
```

- Chỉ ARTIST/ARTIST_PRO có quyền theo plan.
- Track phải thuộc user, approved và không deleted.
- Status: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, DELIVERED.
- Tạo notification khi status đổi.
### 10.2. Vinyl Records

Làm như module đặt sản phẩm, chưa cần cổng thanh toán thật ở giai đoạn đầu.

```text
entities/VinylOrder.javarepositories/VinylOrderRepository.javaservices/VinylOrderService.javacontrollers/VinylOrderController.javaaction flow:DRAFT → QUOTED → CONFIRMED → IN_PRODUCTION → SHIPPED → COMPLETED/CANCELLED
```

### 10.3. Comments Workspace trong Artist Studio

- API lấy comment của tất cả track thuộc artist, phân trang và filter theo track/unread/replied.
- Cho artist trả lời comment nếu Entity hỗ trợ parentId hoặc reply table.
- Cho hide/delete comment theo quyền owner/admin.
- Frontend dùng table/list dark mode, không tải toàn bộ comment một lần.
### 10.4. Reposts

```text
entities/TrackRepost.javaUNIQUE(user_id, track_id)POST   /api/v1/tracks/{trackId}/repostDELETE /api/v1/tracks/{trackId}/repostGET    /api/v1/users/{userId}/reposts
```

Sau khi có module, Artist Studio stats mới có thể trả reposts thật.

### 10.5. Downloads

- Track cần field allowDownload hoặc permission theo plan.
- Không trả URL file gốc công khai nếu cần kiểm soát; tạo endpoint download có auth/log.
- Lưu TrackDownloadEvent gồm userId nullable, trackId, timestamp, IP hash/user agent nếu chính sách cho phép.
- Stats downloads đếm từ event table.
### 10.6. Earnings/Monetization

Không tính tiền trực tiếp từ countPlay hiện tại. Cần ledger bất biến để audit.

```text
entities/EarningLedger.java- id- artist_id- track_id nullable- source- gross_amount- platform_fee- net_amount- currency- status- reference_id- occurred_atGET /api/v1/artist-studio/earnings/summaryGET /api/v1/artist-studio/earnings/ledger
```

### 10.7. Payment cho Subscription

- Tách PaymentTransaction khỏi UserSubscription.
- Không tin redirect frontend là thanh toán thành công; chỉ webhook/backend confirmation được đổi trạng thái.
- Webhook phải idempotent bằng providerTransactionId UNIQUE.
- Lưu raw payload ở dạng an toàn, không lưu card data.
## 11. CÁC LỖI KỸ THUẬT TỒN ĐỌNG CẦN XỬ LÝ

| Vấn đề | Cách xử lý | Ưu tiên |
| --- | --- | --- |
| Follow mapping trùng | Search endpoint /api/v1/users/{id}/follow trong FollowController và UserController; giữ một mapping duy nhất. | Cao |
| Playlist endpoint không thống nhất | Đối chiếu FE api.ts, Controller và Postman; chuẩn hóa create/update/my-playlists, tránh /empty nếu backend không map. | Cao |
| Comment name luôn User | toCommentResponse phải load đúng user và trả name/avatar; FE không fallback “User” khi dữ liệu có thật. | Cao |
| Profile non-owner đổi cover | Chỉ render input/upload khi isOwner; backend vẫn phải kiểm tra owner. | Cao |
| Header login flicker | Trong lúc useSession status=loading không render Login hoặc user menu sai trạng thái. | Trung bình |
| Footer/WaveTrack volume và mute lệch | Đặt một nguồn state volume/muted trong TrackContext; cả footer và slug page đọc/ghi cùng state. | Trung bình |
| Son Tung track không hiện | Kiểm tra uploaderId seed, approvalStatus, isDeleted, query profile và mapping id/_id. | Trung bình |
| Library Following chưa load | Đối chiếu /users/me/following và component tab; xử lý pagination/response shape. | Trung bình |
| LocalDateTime mismatch | Loại bỏ import java.util.Date còn thừa và comparator/DTO dùng Date. | Trung bình |
| Auth extraction lặp | Về sau tạo CurrentUserService hoặc AuthHelper thay vì copy getBearerToken/getCurrentUser ở nhiều controller. | Trung bình |

## 12. KẾ HOẠCH DATABASE VÀ MIGRATION

### 12.1. Nguyên tắc

- Không sửa tay production database mà không có script migration.
- Mỗi bảng mới phải có index theo query chính.
- Unique constraint dùng để bảo vệ nghiệp vụ, không chỉ kiểm tra bằng Java.
- Timestamp dùng DATETIME và mapping LocalDateTime.
- Soft delete phải được mọi query business lọc isDeleted=false.
### 12.2. Index quan trọng

```text
notifications:INDEX(recipient_id, created_at)INDEX(recipient_id, is_read)UNIQUE(deduplication_key)user_follows:UNIQUE(follower_id, following_id)INDEX(following_id, created_at)track_likes/reposts:UNIQUE(user_id, track_id)INDEX(track_id, created_at)subscription_usages:INDEX(user_id, period_start, period_end)
```

### 12.3. Khi thêm module mới

1. Viết entity và migration SQL/Flyway/Liquibase tùy project.

2. Chạy migration trên database local có dữ liệu thật.

3. Kiểm tra rollback hoặc ít nhất backup trước migration phá vỡ.

4. Seed tối thiểu để FE có dữ liệu test.

5. Cập nhật Postman và tài liệu bàn giao.

## 13. CHIẾN LƯỢC TEST VÀ DEFINITION OF DONE

### 13.1. Test Backend tối thiểu

- Happy path.
- Unauthorized 401.
- Forbidden 403.
- Not found 404.
- Validation 400.
- Duplicate/idempotency.
- Self-action bị chặn khi cần.
- Transaction rollback hoặc side-effect handling đúng.
- Pagination page/size biên và max size.
### 13.2. Test Frontend tối thiểu

- Loading, empty, error, success.
- Session loading/unauthenticated/authenticated.
- Mobile width và desktop.
- Dark mode contrast.
- Double click / rapid action không gửi request trùng.
- Navigation đúng route.
- State cập nhật sau mutation không cần reload vô lý.
### 13.3. Definition of Done cho mỗi task

| ☐ | Backend build pass. |
| --- | --- |
| ☐ | Frontend lint/build pass. |
| ☐ | Postman request được thêm/cập nhật. |
| ☐ | Test ít nhất hai role nếu task liên quan quyền. |
| ☐ | Không lộ token/password/file path local. |
| ☐ | Không có warning runtime quan trọng trên browser console. |
| ☐ | Không phá dark mode. |
| ☐ | Commit message rõ ràng và PR có mô tả test. |
| ☐ | Tài liệu/README được cập nhật nếu có endpoint/schema mới. |

## 14. QUY TRÌNH GIT/GITHUB VÀ BẢO MẬT

### 14.1. Branch và commit

```text
main                # nhánh ổn địnhfeature/notification-followfeature/distribution-corefix/profile-owner-coverfix/audio-volume-syncCommit ví dụ:feat(notification): add follow notification triggerfix(profile): prevent non-owner cover uploadrefactor(auth): centralize current user extraction
```

### 14.2. Không được commit

```text
.env.env.*!.env.example*.postman_environment.json.postman/uploads/audio/*uploads/images/*# giữ file seed/default có chủ đích bằng exception nếu cần
```

- JWT, refresh token, OTP, password.
- application.properties chứa DB password thật.
- Đường dẫn file cá nhân C:\Users\... hoặc F:\....
- File audio có bản quyền hoặc dữ liệu người dùng thật.
### 14.3. Review trước merge

1. Pull/rebase nhánh mới nhất.

2. Build BE và FE.

3. Chạy test Postman liên quan.

4. Kiểm tra diff không chứa secret.

5. Reviewer kiểm tra endpoint, auth, transaction và response shape.

6. Merge sau khi ít nhất một thành viên khác xác nhận.

## 15. PHÂN CÔNG CÔNG VIỆC ĐỀ XUẤT CHO NHÓM

| Người/nhóm | Phạm vi | Deliverable | Phụ thuộc |
| --- | --- | --- | --- |
| Backend A | Notification triggers Follow/Like | Service helper + hook + Postman + tests | Follow/Like endpoint chuẩn |
| Backend B | Track moderation + notification | Approve/reject/copyright/process flow | Admin track controller |
| Backend C | Distribution core | Entity, migration, CRUD/status | Subscription permission |
| Frontend A | Notification stabilization | Bell/page/settings API, shared state | Notification BE runtime |
| Frontend B | Artist Studio tabs | Distribution/Vinyl/Comments UI | API từ Backend C |
| QA/Postman | Regression collection | Environment, test cases, bug report | Build mới nhất |

### 15.1. Thứ tự thực hiện đề xuất

1. Ổn định Notification Comment end-to-end.

2. Sửa mapping Follow và gắn NEW_FOLLOW.

3. Chuẩn hóa Like endpoint và gắn TRACK_LIKE.

4. Gắn track moderation notification.

5. Gắn subscription/quota notification.

6. Làm settings notification backend.

7. Sau đó mới bắt đầu Distribution/Vinyl/Payment.

## 16. CHECKLIST TIẾP NHẬN TRONG NGÀY ĐẦU TIÊN

| ☐ | Clone được repo và checkout đúng branch. |
| --- | --- |
| ☐ | BE chạy ở port 8000. |
| ☐ | FE chạy và login được. |
| ☐ | Import Postman PUBLIC_SAFE, tạo Environment local. |
| ☐ | Login user/admin và lưu token. |
| ☐ | Mở được MySQL và xem các bảng chính. |
| ☐ | Đọc TrackController, User/Follow controller, NotificationService, SubscriptionService. |
| ☐ | Đọc src/utils/api.ts, TrackContext, Header, notifications/page.tsx. |
| ☐ | Test comment notification bằng hai user. |
| ☐ | Chọn một task nhỏ, tạo branch và mở PR thử. |

## 17. TROUBLESHOOTING THƯỜNG GẶP

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
| --- | --- | --- |
| 401 mọi API | Token field trong session sai hoặc Bearer header không gửi | Inspect session, Network; thống nhất accessToken/access_token trong một helper. |
| Ambiguous handler methods | Hai controller map cùng route | Search endpoint và xóa/đổi một mapping. |
| 405 Method Not Allowed | FE gọi sai method hoặc endpoint | Đối chiếu api.ts, Controller và Postman. |
| Notification không tạo | Hook đặt sai controller, self-action, setting off hoặc exception bị catch | Kiểm tra log, DB và user/track owner IDs. |
| Badge không đổi | Polling chưa chạy, token rỗng, response unreadCount khác shape | Gọi trực tiếp API và inspect response. |
| Bấm notification 404 | redirectUrl không khớp route track/profile | Dùng route helper chung thay vì nối chuỗi rải rác. |
| CurrentTrack possibly null | Đọc currentTrack._id trực tiếp | Dùng optional chaining hoặc guard. |
| MUI Tooltip warning disabled button | Tooltip bọc trực tiếp disabled button | Bọc button trong span. |
| bis_skin_checked warning | Browser extension chèn attribute | Test Incognito; không sửa app code. |
| File nặng nhưng ảnh mờ | Nguồn ảnh nhỏ hoặc export sai pixel/DPI | Không liên quan module code; kiểm tra asset gốc. |

## 18. PHỤ LỤC API HIỆN CÓ TRONG POSTMAN

Danh sách dưới đây được trích từ collection UPDATED_FULL tại thời điểm bàn giao. Nếu code thay đổi, phải cập nhật collection cùng PR.

### 01 - Authentication (11 request)

| Method | Tên request | URL |
| --- | --- | --- |
| POST | Login User | {{baseUrl}}/api/v1/auth/login |
| POST | Login Admin | {{baseUrl}}/api/v1/auth/login |
| POST | Register | {{baseUrl}}/api/v1/auth/register |
| POST | Verify Register OTP | {{baseUrl}}/api/v1/auth/verify-otp |
| POST | Resend Register OTP | {{baseUrl}}/api/v1/auth/resend-otp |
| POST | Forgot Password | {{baseUrl}}/api/v1/auth/forgot-password |
| POST | Reset Password | {{baseUrl}}/api/v1/auth/reset-password |
| GET | Get Account | {{baseUrl}}/api/v1/auth/account |
| POST | Refresh Token | {{baseUrl}}/api/v1/auth/refresh |
| POST | Logout | {{baseUrl}}/api/v1/auth/logout |
| POST | Social Media Login | {{baseUrl}}/api/v1/auth/social-media |

### 02 - Users (Public / Profile) (2 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get User by ID | {{baseUrl}}/api/v1/users/{{userId}} |
| GET | Artist Leaderboard | {{baseUrl}}/api/v1/users/leaderboard/artists?limit=10 |

### 03 - Follow (8 request)

| Method | Tên request | URL |
| --- | --- | --- |
| POST | Follow User | {{baseUrl}}/api/v1/users/{{targetUserId}}/follow |
| DELETE | Unfollow User | {{baseUrl}}/api/v1/users/{{targetUserId}}/follow |
| GET | Get Follow Status | {{baseUrl}}/api/v1/users/{{targetUserId}}/follow-status |
| GET | Get User Followers | {{baseUrl}}/api/v1/users/{{userId}}/followers?current=1&pageSize=20 |
| GET | Get User Following | {{baseUrl}}/api/v1/users/{{userId}}/following?current=1&pageSize=20 |
| GET | Get My Followers (alternate endpoint) | {{baseUrl}}/api/v1/users/me/followers |
| GET | Get My Following (alternate endpoint) | {{baseUrl}}/api/v1/users/me/following |
| GET | Who To Follow | {{baseUrl}}/api/v1/users/who-to-follow?limit=12 |

### 04 - Tracks (12 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get Tracks with Pagination | {{baseUrl}}/api/v1/tracks?current=1&pageSize=10 |
| GET | Get All Approved Tracks | {{baseUrl}}/api/v1/tracks/find-all |
| GET | Get Track by ID | {{baseUrl}}/api/v1/tracks/search/{{trackId}} |
| GET | Get Track by Slug or ID | {{baseUrl}}/api/v1/tracks/{{trackSlugOrId}} |
| GET | Get Top Tracks by Category | {{baseUrl}}/api/v1/tracks/top?category={{categorySlug}}&limit=10 |
| GET | Search Tracks | {{baseUrl}}/api/v1/tracks/search?keyword=music |
| GET | Get My Tracks (Artist Studio) | {{baseUrl}}/api/v1/tracks/my-tracks |
| POST | Create Track - Multipart | {{baseUrl}}/api/v1/tracks |
| PATCH | Update Track - Multipart | {{baseUrl}}/api/v1/tracks/{{trackId}} |
| DELETE | Delete Track | {{baseUrl}}/api/v1/tracks/{{trackId}} |
| POST | Increase Play Count | {{baseUrl}}/api/v1/tracks/{{trackId}}/play |
| POST | Create Album | {{baseUrl}}/api/v1/tracks/create-album |

### 05 - Track Interactions (9 request)

| Method | Tên request | URL |
| --- | --- | --- |
| POST | Like Track | {{baseUrl}}/api/v1/tracks/{{trackId}}/like |
| POST | Dislike / Unlike Track | {{baseUrl}}/api/v1/tracks/{{trackId}}/dislike |
| GET | Get My Liked Tracks | {{baseUrl}}/api/v1/tracks/liked |
| GET | Get Track Comments | {{baseUrl}}/api/v1/tracks/{{trackId}}/comments |
| POST | Create Track Comment | {{baseUrl}}/api/v1/tracks/{{trackId}}/comments |
| POST | Save Listening History | {{baseUrl}}/api/v1/tracks/{{trackId}}/history |
| GET | Listening History - Home | {{baseUrl}}/api/v1/tracks/history/home?limit=10 |
| GET | Because You Listened | {{baseUrl}}/api/v1/tracks/because-you-listened?limit=10 |
| GET | Hidden Gems | {{baseUrl}}/api/v1/tracks/hidden-gems?limit=10&maxPlays=1000 |

### 06 - Playlists (6 request)

| Method | Tên request | URL |
| --- | --- | --- |
| POST | Create Empty Playlist | {{baseUrl}}/api/v1/playlists |
| PATCH | Update Playlist | {{baseUrl}}/api/v1/playlists/{{playlistId}} |
| DELETE | Delete Playlist | {{baseUrl}}/api/v1/playlists/{{playlistId}} |
| GET | Get Playlist by ID | {{baseUrl}}/api/v1/playlists/{{playlistId}} |
| GET | Get Playlists with Pagination | {{baseUrl}}/api/v1/playlists?current=1&pageSize=10 |
| GET | Get My Playlists | {{baseUrl}}/api/v1/playlists/my-playlists |

### 07 - Categories (7 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get Categories | {{baseUrl}}/api/v1/categories?current=1&pageSize=100 |
| GET | Get All Categories | {{baseUrl}}/api/v1/categories/all |
| GET | Get Category by ID | {{baseUrl}}/api/v1/categories/{{categoryId}} |
| GET | Get Category by Slug | {{baseUrl}}/api/v1/categories/slug/{{categorySlug}} |
| POST | Create Category | {{baseUrl}}/api/v1/categories |
| PUT | Update Category | {{baseUrl}}/api/v1/categories/{{categoryId}} |
| DELETE | Delete Category | {{baseUrl}}/api/v1/categories/{{categoryId}} |

### 08 - Uploads (2 request)

| Method | Tên request | URL |
| --- | --- | --- |
| POST | Upload Image | {{baseUrl}}/api/v1/uploads/image |
| POST | Upload Audio | {{baseUrl}}/api/v1/uploads/audio |

### 09 - Artist Studio (3 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get Artist Studio Stats | {{baseUrl}}/api/v1/artist-studio/stats |
| GET | Get Artist Studio Benefits | {{baseUrl}}/api/v1/artist-studio/benefits |
| GET | Get My Artist Tracks | {{baseUrl}}/api/v1/tracks/my-tracks |

### 10 - Subscription (8 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get Subscription Plans | {{baseUrl}}/api/v1/subscriptions/plans |
| GET | Get My Subscription | {{baseUrl}}/api/v1/subscriptions/me |
| GET | Get My Subscription Usage | {{baseUrl}}/api/v1/subscriptions/me/usage |
| POST | Subscribe ARTIST | {{baseUrl}}/api/v1/subscriptions/subscribe |
| POST | Subscribe ARTIST_PRO | {{baseUrl}}/api/v1/subscriptions/subscribe |
| POST | Change Plan | {{baseUrl}}/api/v1/subscriptions/change-plan |
| POST | Cancel Subscription at Period End | {{baseUrl}}/api/v1/subscriptions/cancel |
| POST | Test Invalid Plan | {{baseUrl}}/api/v1/subscriptions/subscribe |

### 11 - Notifications (7 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get Notifications - All | {{baseUrl}}/api/v1/notifications?page=0&size=20&status=all |
| GET | Get Notifications - Unread | {{baseUrl}}/api/v1/notifications?page=0&size=20&status=unread |
| GET | Get Unread Notification Count | {{baseUrl}}/api/v1/notifications/unread-count |
| PATCH | Mark Notification as Read | {{baseUrl}}/api/v1/notifications/{{notificationId}}/read |
| PATCH | Mark All Notifications as Read | {{baseUrl}}/api/v1/notifications/read-all |
| DELETE | Delete Notification | {{baseUrl}}/api/v1/notifications/{{notificationId}} |
| DELETE | Clear Read Notifications | {{baseUrl}}/api/v1/notifications/clear-read |

### 12 - Admin Users (5 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get All Users | {{baseUrl}}/api/v1/users/all |
| GET | Get Users with Pagination | {{baseUrl}}/api/v1/users?current=1&pageSize=10 |
| POST | Create User | {{baseUrl}}/api/v1/users |
| PATCH | Update User | {{baseUrl}}/api/v1/users/update/{{userId}} |
| DELETE | Delete User | {{baseUrl}}/api/v1/users/{{userId}} |

### 13 - Admin Tracks (3 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get Admin Tracks | {{baseUrl}}/api/v1/admin/tracks/find-all?current=1&pageSize=10 |
| PATCH | Approve Track | {{baseUrl}}/api/v1/admin/tracks/{{trackId}}/approve |
| PATCH | Reject Track | {{baseUrl}}/api/v1/admin/tracks/{{trackId}}/reject |

### 14 - Admin Comments (2 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get All Comments | {{baseUrl}}/api/v1/comments?current=1&pageSize=10 |
| DELETE | Delete Comment | {{baseUrl}}/api/v1/comments/{{commentId}} |

### 15 - Admin Artist Benefits (5 request)

| Method | Tên request | URL |
| --- | --- | --- |
| GET | Get All Artist Benefits | {{baseUrl}}/api/v1/admin/artist-benefits |
| POST | Create Artist Benefit | {{baseUrl}}/api/v1/admin/artist-benefits |
| PUT | Update Artist Benefit | {{baseUrl}}/api/v1/admin/artist-benefits/{{benefitId}} |
| PATCH | Toggle Artist Benefit | {{baseUrl}}/api/v1/admin/artist-benefits/{{benefitId}}/toggle |
| DELETE | Delete Artist Benefit | {{baseUrl}}/api/v1/admin/artist-benefits/{{benefitId}} |

## 19. PHỤ LỤC SƠ ĐỒ FILE CẦN BIẾT

### 19.1. Backend – file cần đọc trước khi làm task

| Module | File trọng tâm | Ghi chú |
| --- | --- | --- |
| Auth | AuthController, JwtHelper, UserRepository | Login/session/current user |
| Track | TrackController, TrackService nếu có, TrackRepository, Track | Upload, play, like, comment, profile track |
| Comment | CommentController admin, CommentRepository, Comment | Admin list/delete; create hiện ở TrackController |
| Follow | FollowController/UserController, UserFollowRepository, UserFollow | Phải xử lý mapping trùng trước |
| Notification | NotificationController, NotificationService, NotificationRepository, Notification | Core đã có |
| Subscription | SubscriptionController, SubscriptionService, repositories/entities liên quan | Plan, usage, quota |
| Artist Studio | ArtistStudioController/Service, ArtistBenefit files | Stats và benefits |
| Admin Track | Admin track controller/service | Approve/reject/copyright notification |

### 19.2. Frontend – file cần đọc trước khi làm task

```text
src/utils/api.tssrc/lib/track.wrapper.tsx (hoặc file TrackContext thực tế)src/components/header/... Header + NotificationBellsrc/app/(user)/notifications/page.tsxsrc/app/(user)/artist-studio/...src/app/(user)/plans/...src/app/(user)/profile/...src/app/(admin)/dashboard/benefits/...global.d.ts hoặc declarations.d.ts
```

### 19.3. Cách tìm file khi tên khác

- Search endpoint URL trong repo.
- Search tên method API trong src/utils/api.ts.
- Search Entity getter/setter hoặc repository.save(...).
- Search component text hiển thị trên UI.
- Không đoán tên file khi có thể search chính xác.
## KẾT LUẬN BÀN GIAO

Dự án đã có nền tảng đủ để nhóm tiếp tục phát triển mà không cần viết lại kiến trúc. Ưu tiên hiện tại không phải thêm nhiều màn hình mới, mà là chuẩn hóa endpoint, hoàn thiện trigger Notification, test end-to-end và xử lý các lỗi state/permission còn tồn tại.

> MỐC BÀN GIAO ĐƯỢC XEM LÀ HOÀN TẤTKhi một thành viên mới có thể clone repo, chạy BE/FE, import Postman, test Comment Notification bằng hai user, đọc đúng file cần sửa và mở PR cho trigger Follow mà không cần hỏi lại cấu trúc cơ bản của dự án.
