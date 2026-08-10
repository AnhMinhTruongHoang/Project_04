# HƯỚNG DẪN PHÁT TRIỂN TIẾP SOUNDCLONE MOBILE (FLUTTER)

> **Project 04 — SoundClone**  
> **Phạm vi:** `Project_04/Mobile`  
> **Ngôn ngữ tài liệu:** Tiếng Việt  
> **Mốc audit mã nguồn:** 10/08/2026  
> **Mục tiêu:** Làm tài liệu bàn giao và roadmap kỹ thuật để tiếp tục phát triển Flutter Mobile đến mức gần parity với Web mà không phá kiến trúc hiện tại.

---

# MỤC LỤC

1. [Mục đích tài liệu](#1-mục-đích-tài-liệu)
2. [Kết luận nhanh sau khi audit Mobile hiện tại](#2-kết-luận-nhanh-sau-khi-audit-mobile-hiện-tại)
3. [Cấu trúc Mobile hiện tại](#3-cấu-trúc-mobile-hiện-tại)
4. [Các package hiện đang dùng](#4-các-package-hiện-đang-dùng)
5. [Luồng khởi động ứng dụng hiện tại](#5-luồng-khởi-động-ứng-dụng-hiện-tại)
6. [Luồng Authentication hiện tại](#6-luồng-authentication-hiện-tại)
7. [Luồng Network / Token Refresh hiện tại](#7-luồng-network--token-refresh-hiện-tại)
8. [Điểm mạnh nên giữ nguyên](#8-điểm-mạnh-nên-giữ-nguyên)
9. [Các điểm chưa hoàn thiện / cần sửa](#9-các-điểm-chưa-hoàn-thiện--cần-sửa)
10. [Kiến trúc mục tiêu cho Mobile](#10-kiến-trúc-mục-tiêu-cho-mobile)
11. [Quy tắc code bắt buộc từ đây](#11-quy-tắc-code-bắt-buộc-từ-đây)
12. [Roadmap tổng thể](#12-roadmap-tổng-thể)
13. [Phase 0 — Chốt baseline trước khi code tiếp](#13-phase-0--chốt-baseline-trước-khi-code-tiếp)
14. [Phase 1 — Shared Models, UI State và Theme](#14-phase-1--shared-models-ui-state-và-theme)
15. [Phase 2 — Home thật từ Backend](#15-phase-2--home-thật-từ-backend)
16. [Phase 3 — Global Audio Player](#16-phase-3--global-audio-player)
17. [Phase 4 — Track Detail, Like, Comment, History](#17-phase-4--track-detail-like-comment-history)
18. [Phase 5 — Search](#18-phase-5--search)
19. [Phase 6 — Library và Playlist](#19-phase-6--library-và-playlist)
20. [Phase 7 — Profile và Social](#20-phase-7--profile-và-social)
21. [Phase 8 — Notifications](#21-phase-8--notifications)
22. [Phase 9 — Subscription / Artist Pro / Demo](#22-phase-9--subscription--artist-pro--demo)
23. [Phase 10 — Artist Studio](#23-phase-10--artist-studio)
24. [Phase 11 — Membership / Community](#24-phase-11--membership--community)
25. [Phase 12 — Ticketing / QR / Check-in](#25-phase-12--ticketing--qr--check-in)
26. [Phase 13 — Payment / VNPay / Test Payment](#26-phase-13--payment--vnpay--test-payment)
27. [Phase 14 — Upload Track trên Mobile](#27-phase-14--upload-track-trên-mobile)
28. [Router mục tiêu](#28-router-mục-tiêu)
29. [State Management bằng Riverpod](#29-state-management-bằng-riverpod)
30. [Thiết kế Repository / Provider / Screen](#30-thiết-kế-repository--provider--screen)
31. [API mapping và cách dùng ApiService](#31-api-mapping-và-cách-dùng-apiservice)
32. [Pagination và chống over-fetch](#32-pagination-và-chống-over-fetch)
33. [Thiết kế Global Player chi tiết](#33-thiết-kế-global-player-chi-tiết)
34. [Payment và Deep Link chi tiết](#34-payment-và-deep-link-chi-tiết)
35. [QR Scanner chi tiết](#35-qr-scanner-chi-tiết)
36. [Error handling chuẩn](#36-error-handling-chuẩn)
37. [Loading / Empty / Error / Success UI](#37-loading--empty--error--success-ui)
38. [Security](#38-security)
39. [Logging](#39-logging)
40. [Testing Strategy](#40-testing-strategy)
41. [Checklist test E2E từng module](#41-checklist-test-e2e-từng-module)
42. [Definition of Done](#42-definition-of-done)
43. [Lỗi thường gặp](#43-lỗi-thường-gặp)
44. [Cách chạy project trên Windows](#44-cách-chạy-project-trên-windows)
45. [Cách chạy với Android Emulator](#45-cách-chạy-với-android-emulator)
46. [Build Release](#46-build-release)
47. [Kế hoạch commit đề xuất](#47-kế-hoạch-commit-đề-xuất)
48. [Kế hoạch 2 tuần đầu](#48-kế-hoạch-2-tuần-đầu)
49. [Những thứ chưa nên refactor](#49-những-thứ-chưa-nên-refactor)
50. [Checklist bàn giao cuối cùng](#50-checklist-bàn-giao-cuối-cùng)

---

# 1. MỤC ĐÍCH TÀI LIỆU

Tài liệu này không phải tutorial Flutter chung.

Nó được viết riêng cho **SoundClone Mobile** dựa trên cấu trúc hiện có trong repository.

Mục tiêu là để một developer mở project Mobile lên có thể trả lời ngay:

- Project đang ở đâu?
- Phần nào đã chạy?
- Phần nào chỉ là placeholder?
- File nào là nền tảng không được phá?
- Khi làm Home phải tạo file nào?
- Khi làm Player phải đặt state ở đâu?
- Khi làm Search phải gọi API nào?
- Khi làm Profile phải tách provider thế nào?
- Payment Mobile phải xử lý VNPay ra sao?
- Ticket QR scanner phải chống scan lặp như thế nào?
- Test Payment chỉ được bật ở đâu?
- Khi nào một feature được xem là hoàn thành?

**Nguyên tắc quan trọng nhất:**

> Mobile không phải viết lại business logic của Web/Backend.  
> Mobile là một client mới sử dụng cùng Backend REST API và phải tôn trọng toàn bộ rule nghiệp vụ từ Backend.

---

# 2. KẾT LUẬN NHANH SAU KHI AUDIT MOBILE HIỆN TẠI

## 2.1. Mobile hiện không còn là Flutter project rỗng

Nền móng đã có:

- Flutter app bootstrap.
- Material 3 dark theme.
- Riverpod.
- GoRouter.
- Stateful bottom navigation shell.
- Dio.
- Secure token storage.
- Access token.
- Refresh token.
- Automatic Bearer token.
- Automatic refresh khi gặp 401.
- Chống nhiều request refresh chạy song song.
- Login.
- Get current account.
- Logout.
- Auth gate.
- API service lớn đã mirror rất nhiều API từ Web.
- File examples hướng dẫn gọi API.

## 2.2. Nhưng UI chức năng thực tế vẫn còn rất ít

Hiện tại:

- `Home` mới chủ yếu hiển thị user hiện tại.
- `Search` là placeholder.
- `Library` là placeholder.
- `Profile` là placeholder.
- Chưa có global music player thật.
- Chưa có track feed thật trên Home.
- Chưa có search result UI.
- Chưa có playlist/library UI.
- Chưa có profile thật.
- Chưa có membership UI hoàn chỉnh.
- Chưa có ticket UI hoàn chỉnh.
- Chưa có Artist Studio UI hoàn chỉnh.
- Chưa có QR scanner.
- Chưa có VNPay mobile return/deep-link flow hoàn chỉnh.

## 2.3. Kết luận kiến trúc

**Không nên xóa project và làm lại.**

Nền hiện tại là đúng hướng.

Nên tiếp tục theo chiến lược:

```text
GIỮ:
main.dart
ApiConfig
DioClient
TokenStorage
AuthService/AuthProvider
GoRouter shell
ApiService

        ↓

XÂY DẦN:
Models typed
Repositories theo feature
Riverpod providers
Screens
Widgets
Global Player
Payment/deep-link
QR scanner
```

---

# 3. CẤU TRÚC MOBILE HIỆN TẠI

Cấu trúc audit được:

```text
Mobile/
├── android/
├── ios/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   ├── network/
│   │   ├── router/
│   │   └── storage/
│   │
│   ├── features/
│   │   ├── auth/
│   │   └── home/
│   │       └── presentation/
│   │
│   ├── services/
│   │   ├── api/
│   │   └── examples/
│   │
│   ├── shared/
│   │   └── presentation/
│   │
│   └── main.dart
│
├── linux/
├── macos/
├── web/
├── windows/
├── pubspec.yaml
├── pubspec.lock
├── analysis_options.yaml
└── README.md
```

## Các file quan trọng nhất hiện tại

```text
lib/main.dart

lib/core/config/api_config.dart
lib/core/network/dio_client.dart
lib/core/router/app_router.dart
lib/core/storage/token_storage.dart

lib/features/auth/data/auth_service.dart
lib/features/auth/models/auth_response.dart
lib/features/auth/models/user_model.dart
lib/features/auth/presentation/auth_gate.dart
lib/features/auth/presentation/login_screen.dart
lib/features/auth/presentation/splash_screen.dart
lib/features/auth/providers/auth_provider.dart

lib/features/home/presentation/home_screen.dart

lib/shared/presentation/app_shell.dart

lib/services/api/api_service.dart
lib/services/examples/api_usage_examples.dart
```

---

# 4. CÁC PACKAGE HIỆN ĐANG DÙNG

`pubspec.yaml` hiện có:

```yaml
dependencies:
  flutter:
    sdk: flutter

  cupertino_icons: ^1.0.8
  http: ^1.6.0
  dio: ^5.10.0
  flutter_riverpod: ^3.3.2
  go_router: ^17.3.0
  flutter_secure_storage: ^10.3.1

dev_dependencies:
  flutter_test:
    sdk: flutter

  flutter_lints: ^6.0.0
```

## Đánh giá

| Package                | Trạng thái | Hướng xử lý                                |
| ---------------------- | ---------- | ------------------------------------------ |
| dio                    | Giữ        | HTTP client chính                          |
| flutter_riverpod       | Giữ        | State management                           |
| go_router              | Giữ        | Routing                                    |
| flutter_secure_storage | Giữ        | Token                                      |
| http                   | Tạm giữ    | `api_service.dart` hiện còn có thể sử dụng |
| flutter_lints          | Giữ        | Static analysis                            |

## Package có thể thêm khi đến đúng phase

Không thêm tất cả ngay từ đầu.

Khi làm Player:

```text
just_audio
audio_session
```

Khi làm artwork/cache:

```text
cached_network_image
```

Khi mở VNPay external browser:

```text
url_launcher
```

Khi cần deep link:

```text
app_links
```

Khi làm QR scanner:

```text
mobile_scanner
```

Khi chọn ảnh/audio upload:

```text
image_picker
file_picker
```

**Không ghi cứng version vào tài liệu này.**  
Khi bắt đầu từng phase, kiểm tra version stable tương thích với Flutter/Dart hiện tại rồi mới thêm.

---

# 5. LUỒNG KHỞI ĐỘNG ỨNG DỤNG HIỆN TẠI

`main.dart` hiện đang làm đúng ba việc quan trọng:

```text
WidgetsFlutterBinding.ensureInitialized()
        ↓
DioClient.initialize()
        ↓
ProviderScope
        ↓
SoundCloneApp
        ↓
MaterialApp.router
        ↓
appRouter
```

Theme hiện tại:

```text
Brightness.dark
scaffoldBackgroundColor = #0D0D0D
seedColor = #FF5500
Material 3 = true
```

Đây phù hợp với SoundClone.

## Không nên làm

Không gọi lại:

```dart
DioClient.initialize();
```

ở từng screen.

Chỉ initialize một lần khi app boot.

---

# 6. LUỒNG AUTHENTICATION HIỆN TẠI

## Login

```text
LoginScreen
    ↓
authProvider.notifier.login(...)
    ↓
AuthService.login(...)
    ↓
POST /auth/login
    ↓
AuthResponse
    ↓
save access_token
save refresh_token
    ↓
authProvider = UserModel
    ↓
AppShell / Home
```

## Khởi động app khi đã login trước đó

```text
authProvider.build()
    ↓
TokenStorage.getAccessToken()
TokenStorage.getRefreshToken()
    ↓
Có token?
    ↓ yes
GET /auth/account
    ↓
UserModel
```

Nếu token không còn hợp lệ và refresh thất bại:

```text
clearTokens()
    ↓
user = null
    ↓
LoginScreen
```

## Logout

```text
POST /auth/logout
    ↓
dù BE lỗi vẫn:
clearTokens()
    ↓
authProvider = null
```

Đây là behavior hợp lý.

---

# 7. LUỒNG NETWORK / TOKEN REFRESH HIỆN TẠI

`DioClient` hiện có:

```text
baseUrl = ApiConfig.apiV1

connectTimeout = 30s
receiveTimeout = 30s
sendTimeout = 30s
```

## Trước mỗi request

```text
TokenStorage.getAccessToken()
    ↓
Authorization: Bearer <token>
```

## Khi server trả 401

```text
Request A → 401
        ↓
kiểm tra request có phải:
login / refresh / logout?
        ↓ no
_refreshAccessToken()
        ↓
POST /auth/refresh
        ↓
save token mới
        ↓
retry request A đúng 1 lần
```

## Điểm tốt

Project có `_refreshingFuture`.

Điều này giúp:

```text
Request A → 401
Request B → 401
Request C → 401

không tạo:
3 request /auth/refresh

mà dùng:
1 shared refresh request
```

Đây là phần **nên giữ**.

---

# 8. ĐIỂM MẠNH NÊN GIỮ NGUYÊN

## 8.1. `ApiConfig`

```dart
static const String baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8000',
);
```

Đây là cách phù hợp cho Android Emulator.

## 8.2. `TokenStorage`

Access token và refresh token đang lưu bằng:

```text
flutter_secure_storage
```

Không chuyển sang:

```text
SharedPreferences
```

cho token nhạy cảm.

## 8.3. `DioClient`

Giữ:

- auto Bearer.
- auto refresh.
- retry một lần.
- shared refresh future.
- clear token khi refresh thất bại.

## 8.4. `StatefulShellRoute.indexedStack`

Giữ mô hình bottom tabs:

```text
Home
Search
Library
Profile
```

Indexed stack giúp giữ state của từng tab tốt hơn khi chuyển qua lại.

## 8.5. `ApiService`

Hiện `api_service.dart` rất lớn, nhưng nó là bridge hữu ích để Mobile đạt API parity với Web.

**Chưa nên xé nhỏ ngay.**

Dùng nó làm API catalog trước.

Khi từng feature ổn định mới có thể refactor dần.

---

# 9. CÁC ĐIỂM CHƯA HOÀN THIỆN / CẦN SỬA

## 9.1. Home chưa phải Home music thật

Hiện Home mới hiển thị:

- avatar.
- display name.
- email.
- title `SoundClone Home`.
- logout.

Cần thay thành music home thật.

## 9.2. Search / Library / Profile vẫn placeholder

Router hiện trả trực tiếp:

```dart
Scaffold(
  body: Center(
    child: Text('Search'),
  ),
)
```

Tương tự Library và Profile.

Cần tách thành file screen thật.

## 9.3. User-facing text chưa đồng nhất English

Ví dụ AuthService còn trả lỗi tiếng Việt:

```text
Kết nối đến máy chủ quá thời gian.
Không thể kết nối đến máy chủ SoundClone.
```

Home còn:

```text
Đăng xuất
```

Trong SoundClone, UI hiển thị cho user nên thống nhất **English**.

Tài liệu kỹ thuật này là tiếng Việt, nhưng text trong app nên là:

```text
Log out
Connection to the server timed out.
Unable to connect to SoundClone.
Something went wrong while connecting to the server.
```

## 9.4. LogInterceptor đang log khá nhiều

Hiện đang bật:

```text
requestBody = true
responseBody = true
requestHeader = true
```

Dev thì tiện.

Release không nên log toàn bộ request/response/header.

Phải giới hạn theo debug mode.

## 9.5. `dynamic` còn nhiều

`ApiService` sử dụng nhiều map/dynamic để mirror API nhanh.

Không nên để UI feature tiếp tục dùng:

```dart
Map<String, dynamic>
```

khắp nơi.

Nên parse thành model typed ở layer feature.

---

# 10. KIẾN TRÚC MỤC TIÊU CHO MOBILE

Đề xuất target:

```text
lib/
├── core/
│   ├── config/
│   │   └── api_config.dart
│   │
│   ├── network/
│   │   ├── dio_client.dart
│   │   ├── api_exception.dart
│   │   └── api_response_parser.dart
│   │
│   ├── router/
│   │   └── app_router.dart
│   │
│   ├── storage/
│   │   └── token_storage.dart
│   │
│   ├── theme/
│   │   ├── app_colors.dart
│   │   └── app_theme.dart
│   │
│   └── utils/
│       ├── media_url.dart
│       ├── date_formatter.dart
│       └── debounce.dart
│
├── features/
│   ├── auth/
│   │
│   ├── home/
│   │   ├── data/
│   │   ├── models/
│   │   ├── providers/
│   │   └── presentation/
│   │       └── widgets/
│   │
│   ├── player/
│   ├── track/
│   ├── search/
│   ├── library/
│   ├── playlist/
│   ├── profile/
│   ├── notification/
│   ├── subscription/
│   ├── artist_studio/
│   ├── membership/
│   └── ticket/
│
├── services/
│   ├── api/
│   │   └── api_service.dart
│   └── examples/
│       └── api_usage_examples.dart
│
├── shared/
│   ├── models/
│   ├── providers/
│   └── presentation/
│       ├── app_shell.dart
│       └── widgets/
│
└── main.dart
```

---

# 11. QUY TẮC CODE BẮT BUỘC TỪ ĐÂY

## Rule 1 — Screen không chứa business logic lớn

Không:

```text
Screen
→ gọi Dio
→ parse JSON
→ save token
→ xử lý pagination
→ xử lý business rule
```

Nên:

```text
Screen
→ Provider
→ Repository
→ ApiService
→ DioClient
```

## Rule 2 — Backend là nguồn business truth

Ví dụ membership:

Không làm:

```dart
if (userPaid) {
  allowMembership = true;
}
```

dựa trên state giả local.

Phải lấy access từ Backend.

## Rule 3 — Không load tất cả dữ liệu nếu chỉ cần một phần

Sai:

```text
GET all tracks
→ Mobile filter 1000 records
```

Đúng:

```text
GET tracks?current=1&pageSize=20
```

## Rule 4 — Không gọi API trong `build()`

Sai:

```dart
Widget build(...) {
  api.getTracks();
}
```

Đúng:

- Provider lifecycle.
- init/build của notifier.
- explicit refresh.

## Rule 5 — Một mutation phải chống double tap

Ví dụ:

```text
Follow
Like
Purchase
Publish
Check-in
Upload
```

phải có loading flag.

## Rule 6 — User-facing text dùng English

Ví dụ:

```text
Loading tracks...
No tracks found.
Try again
Follow
Following
Purchase with VNPay
Test Purchase
```

## Rule 7 — Dark mode 100%

Không dùng default black text trên dark background.

## Rule 8 — Mobile-first

Ưu tiên:

- tap target >= hợp lý.
- bottom sheet/dialog không overflow.
- keyboard không che input.
- long title ellipsis.
- horizontal lists có lazy rendering.
- list dùng `ListView.builder`.

---

# 12. ROADMAP TỔNG THỂ

Thứ tự nên làm:

```text
Phase 0  Baseline
    ↓
Phase 1  Shared foundation
    ↓
Phase 2  Real Home
    ↓
Phase 3  Global Player
    ↓
Phase 4  Track Detail + Like + Comments
    ↓
Phase 5  Search
    ↓
Phase 6  Library + Playlist
    ↓
Phase 7  Profile + Social
    ↓
Phase 8  Notifications
    ↓
Phase 9  Subscription
    ↓
Phase 10 Artist Studio
    ↓
Phase 11 Membership
    ↓
Phase 12 Ticketing + QR
    ↓
Phase 13 Payment/Deep link hardening
    ↓
Phase 14 Mobile Upload
    ↓
Hardening + Testing + Release
```

**Không nên nhảy ngay vào Membership/Ticket trước khi Player + Home + Profile ổn.**

---

# 13. PHASE 0 — CHỐT BASELINE TRƯỚC KHI CODE TIẾP

## Mục tiêu

Xác nhận project hiện tại chạy sạch.

## Commands

```powershell
cd F:\ReactSouldCloud\Mobile

flutter clean
flutter pub get
flutter analyze
```

Kỳ vọng:

```text
No issues found
```

Chạy Backend:

```powershell
cd F:\ReactSouldCloud\BE
.\mvnw.cmd spring-boot:run
```

Backend:

```text
http://localhost:8000
```

Launch emulator:

```powershell
cd F:\ReactSouldCloud\Mobile

flutter emulators --launch Pixel_7
flutter devices
```

Run:

```powershell
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:8000 --dart-define=PAYMENT_TEST_MODE=true
```

## Test baseline

- [ ] App boot được.
- [ ] Login được.
- [ ] Token lưu được.
- [ ] Kill/reopen app vẫn login nếu token còn hợp lệ.
- [ ] Access token expire → refresh token chạy.
- [ ] Logout → quay Login.
- [ ] Home tab hiển thị.
- [ ] Search tab mở.
- [ ] Library tab mở.
- [ ] Profile tab mở.
- [ ] Không có request loop.
- [ ] Không có crash.

---

# 14. PHASE 1 — SHARED MODELS, UI STATE VÀ THEME

## 14.1. Tạo AppColors

File:

```text
lib/core/theme/app_colors.dart
```

Gợi ý:

```dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const background = Color(0xFF0D0D0D);
  static const surface = Color(0xFF151515);
  static const surfaceAlt = Color(0xFF1C1C1C);

  static const primary = Color(0xFFFF5500);
  static const primaryLight = Color(0xFFFF6A1A);

  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFFA0A0A0);
  static const textMuted = Color(0xFF707070);

  static const success = Color(0xFF22C55E);
  static const error = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
}
```

## 14.2. Tách AppTheme

File:

```text
lib/core/theme/app_theme.dart
```

`main.dart` không nên phình to khi app lớn.

## 14.3. Shared widgets cần có

```text
lib/shared/presentation/widgets/
├── app_loading.dart
├── app_error_view.dart
├── app_empty_view.dart
├── app_retry_button.dart
├── app_network_image.dart
├── app_section_header.dart
└── app_avatar.dart
```

## 14.4. Media URL helper

Backend có thể trả URL absolute hoặc relative.

Tạo:

```text
lib/core/utils/media_url.dart
```

Không nối URL rải rác trong từng widget.

---

# 15. PHASE 2 — HOME THẬT TỪ BACKEND

## Mục tiêu

Thay `SoundClone Home` placeholder bằng music discovery Home.

## File nên tạo

```text
lib/features/home/
├── data/
│   └── home_repository.dart
│
├── models/
│   └── track_model.dart
│
├── providers/
│   └── home_provider.dart
│
└── presentation/
    ├── home_screen.dart
    └── widgets/
        ├── home_header.dart
        ├── horizontal_track_section.dart
        ├── track_card.dart
        ├── compact_track_tile.dart
        └── home_skeleton.dart
```

## API có thể dùng

Từ ApiService hiện tại:

```text
getTracksApi(...)
getTopTracksApi(...)
getAllTracksApi()
```

Các flow SoundClone Web còn có:

```text
listening history
because you listened
hidden gems
top/category tracks
```

Khi Mobile API service có method tương ứng thì dùng trực tiếp.

## Home layout đề xuất

```text
[ SoundClone ]        [Notification] [Avatar]

Recently played
[card][card][card] →

Trending
[card][card][card] →

Because you listened
[card][card][card] →

Hidden gems
[card][card][card] →

NCS
[card][card][card] →

------------------------------------
Mini Player
Bottom Navigation
```

## Không tải 100 track một lần

Mỗi section Home chỉ nên:

```text
6–10 item
```

Nếu endpoint support `limit`, gửi limit lên Backend.

Không:

```dart
final all = await getAllTracksApi();
final top = all.take(10);
```

nếu Backend có endpoint top/limit.

## Home provider state

Provider nên quản lý:

```text
loading
refreshing
sections
error
```

Không gọi riêng 5 API trong widget build.

---

# 16. PHASE 3 — GLOBAL AUDIO PLAYER

Đây là phase quan trọng nhất sau Home.

## Mục tiêu

Player phải tồn tại xuyên tab:

```text
Home → Search → Library → Profile
```

nhưng audio không reset.

## File đề xuất

```text
lib/features/player/
├── models/
│   ├── player_track.dart
│   └── player_queue.dart
│
├── providers/
│   └── player_provider.dart
│
├── services/
│   └── audio_player_service.dart
│
└── presentation/
    ├── now_playing_screen.dart
    └── widgets/
        ├── mini_player.dart
        ├── player_progress_bar.dart
        └── player_controls.dart
```

## State tối thiểu

```dart
class PlayerState {
  final PlayerTrack? currentTrack;
  final List<PlayerTrack> queue;

  final bool isPlaying;
  final bool isLoading;

  final Duration position;
  final Duration duration;

  final double volume;

  final int currentIndex;
}
```

## Player actions

```text
playTrack(track)
playQueue(queue, index)
togglePlayPause()
pause()
resume()
seek(position)
next()
previous()
setVolume()
stop()
```

## Player phải nằm ở đâu?

Không đặt player state trong Home.

Nên:

```text
ProviderScope
   ↓
global playerProvider
   ↓
AppShell
   ├── navigationShell
   ├── MiniPlayer
   └── NavigationBar
```

Ví dụ layout:

```text
Scaffold
├── body: navigationShell
└── bottomNavigationBar:
    Column
    ├── MiniPlayer
    └── NavigationBar
```

## Listening history

Không gọi history mỗi lần position thay đổi.

Rule đề xuất:

```text
play track
    ↓
nghe đạt threshold
    ↓
POST history đúng 1 lần / playback session
```

Dùng Set:

```text
recordedHistoryTrackIds/session key
```

để tránh spam.

---

# 17. PHASE 4 — TRACK DETAIL, LIKE, COMMENT, HISTORY

## Files

```text
lib/features/track/
├── data/
│   └── track_repository.dart
│
├── models/
│   ├── track_detail_model.dart
│   └── track_comment_model.dart
│
├── providers/
│   ├── track_detail_provider.dart
│   └── track_comments_provider.dart
│
└── presentation/
    ├── track_detail_screen.dart
    └── widgets/
        ├── track_header.dart
        ├── track_actions.dart
        ├── comment_list.dart
        └── comment_input.dart
```

## Flow

```text
Track card
    ↓
/track/:id
    ↓
GET track
GET comments
    ↓
Play
Like
Comment
```

## Like

Optimistic UI có thể dùng, nhưng nếu API fail phải rollback.

```text
false
 ↓ tap
true optimistic
 ↓ API
success → giữ
error → false
```

## Comment

Sau POST comment:

- clear input khi success.
- prepend/append comment đúng ordering.
- không reload cả screen nếu không cần.
- loading riêng cho submit.

---

# 18. PHASE 5 — SEARCH

Router hiện đang placeholder.

## Tạo

```text
lib/features/search/
├── data/
│   └── search_repository.dart
├── providers/
│   └── search_provider.dart
└── presentation/
    ├── search_screen.dart
    └── widgets/
        ├── search_input.dart
        ├── search_result_tile.dart
        └── search_empty_state.dart
```

## API

Dùng:

```text
searchTracksApi(keyword)
```

## Debounce

Không gọi API sau mỗi ký tự ngay lập tức.

Flow:

```text
user gõ
    ↓
300–500ms debounce
    ↓
keyword vẫn giống
    ↓
search
```

## Khi keyword rỗng

Không search.

Có thể hiển thị:

```text
Recent searches
Trending searches
Categories
```

sau này.

---

# 19. PHASE 6 — LIBRARY VÀ PLAYLIST

## Library tabs đề xuất

```text
Liked
Playlists
History
Following
Tickets
```

Tuỳ UI cuối cùng có thể Tickets nằm Profile.

## Files

```text
lib/features/library/
├── providers/
│   └── library_provider.dart
└── presentation/
    ├── library_screen.dart
    └── widgets/
        └── library_tab_bar.dart

lib/features/playlist/
├── data/
│   └── playlist_repository.dart
├── models/
│   └── playlist_model.dart
├── providers/
│   └── playlist_provider.dart
└── presentation/
    ├── playlist_detail_screen.dart
    ├── create_playlist_sheet.dart
    └── widgets/
```

## Các action

```text
get liked tracks
get my playlists
create playlist
update playlist
delete playlist
open playlist
play playlist
```

## Pagination

Library có thể lớn.

Không giữ toàn bộ history/liked trong memory nếu user có hàng nghìn item.

---

# 20. PHASE 7 — PROFILE VÀ SOCIAL

## Files

```text
lib/features/profile/
├── data/
│   └── profile_repository.dart
├── models/
│   ├── profile_model.dart
│   ├── badge_model.dart
│   └── follow_state.dart
├── providers/
│   ├── my_profile_provider.dart
│   └── public_profile_provider.dart
└── presentation/
    ├── profile_screen.dart
    ├── public_profile_screen.dart
    └── widgets/
        ├── profile_header.dart
        ├── profile_stats.dart
        ├── profile_badges.dart
        ├── profile_tabs.dart
        └── follow_button.dart
```

## Profile phải phân biệt

```text
MY PROFILE
vs
OTHER USER PROFILE
```

Owner:

```text
Edit profile
Upload avatar
Upload cover
Manage events
Membership management
```

Non-owner:

```text
Follow
View tracks
View playlists
View concerts
View membership
```

## Follow API

ApiService hiện đã có các helper follow.

Provider nên giữ state:

```text
isFollowing
followersCount
loading
```

Không reload toàn profile chỉ để đổi Follow.

---

# 21. PHASE 8 — NOTIFICATIONS

## File

```text
lib/features/notification/
├── data/
│   └── notification_repository.dart
├── models/
│   └── notification_model.dart
├── providers/
│   └── notification_provider.dart
└── presentation/
    ├── notification_screen.dart
    └── widgets/
        └── notification_tile.dart
```

## Feature

```text
list
unread count
mark read
mark all read
delete
clear read
tap redirect
```

## Header

Home/Profile header có bell:

```text
Bell + unread badge
```

## Polling

Ban đầu:

```text
30–60 giây
```

là đủ.

Chưa cần WebSocket ngay.

---

# 22. PHASE 9 — SUBSCRIPTION / ARTIST PRO / DEMO

Mobile cần mirror rule Backend, không tự nghĩ rule riêng.

## Plans

```text
BASIC
ARTIST
ARTIST_PRO
ARTIST_PRO_DEMO
```

## ARTIST_PRO_DEMO

Flow:

```text
tap Activate 7-day demo
    ↓
POST change-plan
    ↓
Backend active trực tiếp
    ↓
currentPeriodEnd = +7 days
```

Không qua VNPay.

## Paid plan

```text
ARTIST
ARTIST_PRO
    ↓
create VNPay payment
    ↓
open payment URL
    ↓
return/resume
    ↓
GET payment status
    ↓
refresh subscription
```

## Files

```text
lib/features/subscription/
├── data/
│   └── subscription_repository.dart
├── models/
│   ├── subscription_plan_model.dart
│   └── my_subscription_model.dart
├── providers/
│   └── subscription_provider.dart
└── presentation/
    ├── subscription_plans_screen.dart
    └── widgets/
        └── subscription_plan_card.dart
```

---

# 23. PHASE 10 — ARTIST STUDIO

Chỉ hiển thị cho account có quyền/role phù hợp.

## Files

```text
lib/features/artist_studio/
├── data/
│   └── artist_studio_repository.dart
├── models/
│   ├── artist_stats_model.dart
│   ├── artist_wallet_model.dart
│   └── artist_benefit_model.dart
├── providers/
│   ├── artist_studio_provider.dart
│   └── artist_tracks_provider.dart
└── presentation/
    ├── artist_studio_screen.dart
    ├── artist_tracks_screen.dart
    ├── artist_wallet_screen.dart
    └── widgets/
```

## Tabs/sections

```text
Overview
Tracks
Earnings
Wallet
Benefits
Events
Membership
```

Không cần copy pixel-perfect Web.

Ưu tiên mobile UX.

---

# 24. PHASE 11 — MEMBERSHIP / COMMUNITY

## Scope

Artist:

```text
create plan
manage plan
create text post
create image post
create poll
create track preview
```

Member:

```text
purchase
view feed
vote
comment
listen preview
```

## Files

```text
lib/features/membership/
├── data/
│   └── membership_repository.dart
├── models/
│   ├── membership_plan_model.dart
│   ├── membership_access_model.dart
│   ├── membership_post_model.dart
│   └── membership_poll_model.dart
├── providers/
│   ├── membership_provider.dart
│   └── membership_feed_provider.dart
└── presentation/
    ├── membership_plans_screen.dart
    ├── membership_feed_screen.dart
    ├── create_membership_post_screen.dart
    └── widgets/
```

## Track Preview

Mobile player phải support:

```text
previewStartSeconds
previewDurationSeconds
```

Flow:

```text
tap preview
    ↓
seek(start)
    ↓
play
    ↓
position >= start + duration
    ↓
pause/stop preview
```

Nhưng quyền truy cập vẫn phải do Backend quyết định.

Không chỉ disable UI.

---

# 25. PHASE 12 — TICKETING / QR / CHECK-IN

## Buyer

```text
view event
buy
pay
ticket collection
show QR
```

## Artist/Admin

```text
event management
check-in scanner
```

## Files

```text
lib/features/ticket/
├── data/
│   └── ticket_repository.dart
├── models/
│   ├── artist_event_model.dart
│   ├── ticket_payment_model.dart
│   ├── user_ticket_model.dart
│   └── ticket_qr_model.dart
├── providers/
│   ├── event_provider.dart
│   ├── ticket_collection_provider.dart
│   └── ticket_checkin_provider.dart
└── presentation/
    ├── event_detail_screen.dart
    ├── ticket_collection_screen.dart
    ├── ticket_qr_screen.dart
    ├── ticket_scanner_screen.dart
    └── widgets/
```

## Check-in test bắt buộc

```text
QR valid lần 1 → SUCCESS
QR lần 2       → REJECT
user thường    → 403
QR sai         → reject
ticket khác event → reject
```

---

# 26. PHASE 13 — PAYMENT / VNPAY / TEST PAYMENT

## Prefix

SoundClone đang dùng:

```text
SC...   Account subscription
SCM...  Artist membership
SCT...  Ticket
```

Mobile không cần tự route business logic.

Dùng unified:

```text
GET /payments/{orderCode}
```

sau khi payment.

## VNPay là main flow

```text
create order
    ↓
paymentUrl
    ↓
open URL
    ↓
VNPay
    ↓
app resume/deep link
    ↓
GET status
```

## Test Payment

Chỉ show khi:

```dart
ApiConfig.paymentTestMode == true
```

Production:

```text
PAYMENT_TEST_MODE=false
```

## Không làm

Không fake:

```dart
payment.status = 'PAID';
```

ở FE.

Test Payment vẫn phải gọi Backend để chạy business flow thật.

---

# 27. PHASE 14 — UPLOAD TRACK TRÊN MOBILE

Đây nên làm sau Player/Search/Profile.

## Packages

Khi bắt đầu:

```text
file_picker
image_picker
```

## Files

```text
lib/features/artist_studio/presentation/upload_track_screen.dart
lib/features/artist_studio/providers/upload_track_provider.dart
lib/features/artist_studio/models/upload_track_form.dart
```

## Flow

```text
Select audio
Select artwork
Metadata
Category
Visibility
License info
    ↓
multipart upload
    ↓
progress
    ↓
success
```

## Upload progress

Dio hỗ trợ:

```dart
onSendProgress
```

Nên hiện:

```text
Uploading 0–100%
```

---

# 28. ROUTER MỤC TIÊU

Router không nên chứa placeholder Scaffold lâu dài.

Target:

```text
/login

/home
/search
/library
/profile

/track/:trackId
/playlist/:playlistId
/profile/:userId

/notifications

/plans

/artist-studio
/artist-studio/tracks
/artist-studio/upload

/membership/:artistId
/membership/:artistId/create

/events/:eventId
/tickets
/tickets/:ticketId
/tickets/scanner

/payment/result
```

## Rule

Screen file thật phải được import vào router.

Không build UI dài trực tiếp trong `app_router.dart`.

---

# 29. STATE MANAGEMENT BẰNG RIVERPOD

Project đã dùng Riverpod, nên tiếp tục.

## Nên dùng

```text
AsyncNotifierProvider
NotifierProvider
Provider
```

## Không lạm dụng

Không tạo:

```text
StateProvider cho mọi TextField
```

Form local có thể dùng controller/stateful widget.

## Dùng provider khi state:

- dùng nhiều widget.
- cần survive rebuild.
- lấy từ API.
- cần refresh.
- cần pagination.
- cần mutation.
- cần share giữa screens.

---

# 30. THIẾT KẾ REPOSITORY / PROVIDER / SCREEN

Ví dụ Home.

## Repository

```dart
class HomeRepository {
  HomeRepository(this._api);

  final ApiService _api;

  Future<List<TrackModel>> getTopTracks() async {
    final response = await _api.getTopTracksApi(
      category: 'all',
      limit: 10,
    );

    // parse typed model here
    return [];
  }
}
```

## Provider

```dart
final homeProvider =
    AsyncNotifierProvider<HomeNotifier, HomeState>(
  HomeNotifier.new,
);

class HomeNotifier extends AsyncNotifier<HomeState> {
  @override
  Future<HomeState> build() async {
    return _load();
  }

  Future<HomeState> _load() async {
    // call repository
    throw UnimplementedError();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_load);
  }
}
```

## Screen

Screen chỉ:

```text
watch provider
render loading
render error
render data
```

---

# 31. API MAPPING VÀ CÁCH DÙNG APISERVICE

`lib/services/api/api_service.dart` hiện là file API chính của Mobile.

Đừng copy endpoint ra screen.

## Các nhóm đã có hoặc đã được mirror

### Auth

```text
login
refresh
logout
social login
register
verify OTP
resend OTP
forgot password
reset password
```

### User / Social

```text
users
follow
unfollow
follow status
followers
following
who to follow
```

### Track

```text
pagination
find all
track by id
track by slug/id
top tracks
search
my tracks
comments
create album
create/update/delete track
```

### Admin Track

```text
list
approve
reject
license approve/reject
copyright scan
```

### Và các nhóm lớn khác đã được chuẩn bị trong ApiService

```text
playlist
like
category
listening
subscription
benefits
notifications
wallet
payout
membership
ticket
payment
test payment
```

## File reference thứ hai

```text
lib/services/examples/api_usage_examples.dart
```

Dùng file này như:

```text
"how to call API"
```

Không import file examples vào production screen.

---

# 32. PAGINATION VÀ CHỐNG OVER-FETCH

## Model state pagination

```dart
class PagedState<T> {
  final List<T> items;
  final int currentPage;
  final bool hasMore;
  final bool loadingMore;
}
```

## Flow

```text
initial
GET page 1
    ↓
scroll gần bottom
    ↓
GET page 2
    ↓
append
```

## Guard

```text
if loadingMore → return
if !hasMore → return
```

## Tránh bug request loop

Không để dependency/provider tự invalidate liên tục sau mỗi set state.

---

# 33. THIẾT KẾ GLOBAL PLAYER CHI TIẾT

## Yêu cầu tối thiểu

- 1 audio source active.
- mini player.
- full player.
- play/pause.
- seek.
- queue.
- next/previous.
- volume.
- current track.
- artwork.
- title.
- artist.
- duration.
- listening history.

## Queue source

Có thể lưu:

```text
source = home
source = search
source = playlist
source = profile
source = membership-preview
```

## Membership preview không được phá global queue

Nên có mode:

```text
normal
preview
```

Preview có boundary.

## Khi track mới play

```text
set current
load URL
await ready
play
```

Không set `isPlaying=true` trước khi audio load thành công.

---

# 34. PAYMENT VÀ DEEP LINK CHI TIẾT

Mobile không có Next.js return page giống Web.

Cần thiết kế mobile return.

## Option A — External Browser + App Link

```text
Mobile
→ create payment
→ launch paymentUrl
→ VNPay
→ Backend return URL
→ redirect/app link
→ Mobile mở lại
→ GET /payments/{orderCode}
```

## Option B — Browser rồi user quay lại app

Tạm thời dev có thể:

```text
save pending orderCode
open VNPay
AppLifecycle resumed
GET payment status
```

Nhưng production nên có deep-link/app-link rõ ràng.

## State cần lưu

```text
pendingOrderCode
paymentType
createdAt
```

Không cần lưu secret.

---

# 35. QR SCANNER CHI TIẾT

## Package

Khi bắt đầu phase:

```text
mobile_scanner
```

## Android permission

Camera permission phải được cấu hình theo package/platform requirement.

## Scanner flow

Camera trả frame liên tục.

Phải debounce/lock:

```dart
if (_processing) return;

_processing = true;

try {
  await checkIn(...);
} finally {
  await Future.delayed(...);
  _processing = false;
}
```

Nếu không:

```text
1 QR
→ 10 frame
→ 10 API request
```

## UI result

Success:

```text
Check-in successful
Ticket code
Event
Checked-in time
```

Failure:

```text
Ticket already used
Invalid ticket
Unauthorized
Wrong event
```

---

# 36. ERROR HANDLING CHUẨN

Nên tạo:

```text
lib/core/network/api_exception.dart
```

Model:

```dart
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final dynamic data;
}
```

## Map

```text
400 → validation
401 → session/auth
403 → permission
404 → not found
409 → conflict
500 → server
timeout → network timeout
connectionError → cannot connect
```

UI không cần biết DioException trực tiếp.

---

# 37. LOADING / EMPTY / ERROR / SUCCESS UI

Mỗi feature API phải có đủ 4 trạng thái.

## Loading

Không chỉ CircularProgress giữa màn hình với mọi page.

Có thể dùng skeleton cho:

- track cards.
- profile.
- playlist.

## Empty

Ví dụ:

```text
No tracks yet.
No playlists yet.
No notifications.
No tickets yet.
```

## Error

```text
Unable to load tracks.
[Try again]
```

## Success mutation

Dùng Snackbar/toast:

```text
Added to playlist.
Followed successfully.
Ticket checked in.
```

---

# 38. SECURITY

## Không đưa vào Mobile

Tuyệt đối không:

```text
DB password
JWT signing secret
VNPay hash secret
Google client secret
GitHub client secret
server private key
```

APK có thể bị reverse-engineer.

## Có thể có

```text
API base URL
public client ID nếu provider yêu cầu
feature flag không nhạy cảm
```

## Token

Tiếp tục dùng:

```text
flutter_secure_storage
```

## Authorization

UI hide button chỉ là UX.

Backend vẫn phải enforce:

```text
owner
artist
admin
membership
ticket staff
```

---

# 39. LOGGING

Hiện Dio đang log request body, response body và request header.

## Dev

Có thể bật.

## Release

Nên:

```dart
if (kDebugMode) {
  // add LogInterceptor
}
```

Không log:

```text
Authorization header
refresh token
password
OTP
payment secrets
```

---

# 40. TESTING STRATEGY

## 40.1. Unit test

Test:

```text
JSON → Model
Repository response mapping
Pagination state
Player state
Payment state
```

## 40.2. Provider test

Test notifier:

```text
loading → data
loading → error
refresh
loadMore
mutation
```

## 40.3. Widget test

Test:

```text
TrackCard
FollowButton
MiniPlayer
PlanCard
TicketCard
```

## 40.4. Integration/manual E2E

Test trên emulator + Backend thật.

---

# 41. CHECKLIST TEST E2E TỪNG MODULE

## Auth

- [ ] Login đúng.
- [ ] Password sai.
- [ ] Token lưu.
- [ ] Relaunch app.
- [ ] Refresh token.
- [ ] Logout.
- [ ] Token invalid.

## Home

- [ ] Sections load.
- [ ] Pull-to-refresh.
- [ ] Không request loop.
- [ ] Empty state.
- [ ] API fail.
- [ ] Tap track.

## Player

- [ ] Play.
- [ ] Pause.
- [ ] Seek.
- [ ] Next.
- [ ] Previous.
- [ ] Switch tab không dừng.
- [ ] Mini player sync full player.
- [ ] Track mới thay đúng metadata.

## Search

- [ ] Keyword.
- [ ] Debounce.
- [ ] No result.
- [ ] Error.
- [ ] Tap result.

## Library

- [ ] Liked.
- [ ] Playlist.
- [ ] History.
- [ ] Following.
- [ ] Pagination.

## Profile

- [ ] My profile.
- [ ] Other profile.
- [ ] Follow/unfollow.
- [ ] Badges.
- [ ] Owner controls.
- [ ] Non-owner không thấy edit.

## Subscription

- [ ] BASIC.
- [ ] ARTIST VNPay.
- [ ] ARTIST_PRO VNPay.
- [ ] ARTIST_PRO_DEMO direct.
- [ ] Demo +7 days.
- [ ] Expired permission.

## Membership

- [ ] Buy.
- [ ] Test Purchase dev.
- [ ] Active.
- [ ] Non-member locked.
- [ ] Poll.
- [ ] Comment.
- [ ] Track Preview start/end.

## Ticket

- [ ] Event approved.
- [ ] Buy.
- [ ] Payment paid.
- [ ] Ticket collection.
- [ ] QR.
- [ ] Scan first success.
- [ ] Scan second reject.
- [ ] Unauthorized 403.
- [ ] Failed payment release reservation.

---

# 42. DEFINITION OF DONE

Một Mobile feature chỉ được xem là Done khi:

- [ ] `flutter analyze` pass.
- [ ] Không có crash runtime.
- [ ] Loading state.
- [ ] Empty state.
- [ ] Error state.
- [ ] Success state.
- [ ] API response typed ở feature layer.
- [ ] Không gọi Dio trực tiếp rải rác trong UI.
- [ ] Không request loop.
- [ ] Double tap được khóa khi cần.
- [ ] Dark UI contrast tốt.
- [ ] Test Android Emulator.
- [ ] Permission test nếu feature cần role.
- [ ] Token refresh không bị phá.
- [ ] Log không lộ secret.
- [ ] Commit rõ ràng.
- [ ] Route được cập nhật.
- [ ] README/guide cập nhật nếu flow thay đổi.

---

# 43. LỖI THƯỜNG GẶP

## 43.1. Mobile gọi localhost không được

Sai:

```text
http://localhost:8000
```

trên Android Emulator.

Đúng:

```text
http://10.0.2.2:8000
```

## 43.2. Backend chưa chạy

Error:

```text
connection refused
timeout
```

Kiểm tra:

```powershell
cd F:\ReactSouldCloud\BE
.\mvnw.cmd spring-boot:run
```

## 43.3. Request chạy vô hạn

Nguyên nhân thường:

```text
provider invalidates chính nó
API trong build
listener không dispose
state update kích lại fetch
```

## 43.4. 401 loop

Kiểm tra:

- refresh endpoint có bị interceptor bắt lại không.
- retry flag.
- refresh token.
- backend refresh response shape.

DioClient hiện đã có guard, không phá guard này.

## 43.5. 403

Không mặc định coi là bug token.

Có thể là:

```text
role
owner
subscription permission
membership permission
event permission
```

## 43.6. 409

Thường là business conflict:

```text
duplicate
payment state
already processed
plan rule
ticket state
```

Đọc `message` từ Backend.

## 43.7. setState after dispose

Sau await trong StatefulWidget:

```dart
if (!mounted) return;
```

## 43.8. Scroll lag

Không render hàng trăm card bằng `Column`.

Dùng:

```text
ListView.builder
GridView.builder
```

## 43.9. Ảnh load chậm

Khi tới phase UI thật, dùng cache image package và placeholder.

---

# 44. CÁCH CHẠY PROJECT TRÊN WINDOWS

## Backend terminal

```powershell
cd F:\ReactSouldCloud\BE

.\mvnw.cmd spring-boot:run
```

Kỳ vọng:

```text
Tomcat started on port 8000
```

## Mobile terminal

```powershell
cd F:\ReactSouldCloud\Mobile

flutter pub get
flutter analyze
```

---

# 45. CÁCH CHẠY VỚI ANDROID EMULATOR

## Xem emulator

```powershell
flutter emulators
```

Hiện project đang dùng:

```text
Pixel_7
```

## Launch

```powershell
flutter emulators --launch Pixel_7
```

## Xem device

```powershell
flutter devices
```

Ví dụ:

```text
emulator-5554
```

## Run

```powershell
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:8000 --dart-define=PAYMENT_TEST_MODE=true
```

## Không được copy dạng Markdown lỗi

Sai:

```text
API\_BASE\_URL=[http://10.0.2.2:8000](...)
```

Đúng:

```text
API_BASE_URL=http://10.0.2.2:8000
```

---

# 46. BUILD RELEASE

Trước release:

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
```

Production phải:

```text
API_BASE_URL=https://<backend-production>
PAYMENT_TEST_MODE=false
```

Build Android:

```powershell
flutter build apk --release --dart-define=API_BASE_URL=https://<backend-production> --dart-define=PAYMENT_TEST_MODE=false
```

Hoặc App Bundle:

```powershell
flutter build appbundle --release --dart-define=API_BASE_URL=https://<backend-production> --dart-define=PAYMENT_TEST_MODE=false
```

## Production requirements

- HTTPS.
- signing config.
- app icon.
- splash.
- camera permission.
- deep link/app link.
- test payment off.
- verbose network logs off.
- privacy/permission review.

---

# 47. KẾ HOẠCH COMMIT ĐỀ XUẤT

Không làm một commit:

```text
"finish mobile"
```

Nên:

```text
feat(mobile): add shared dark theme and common states
feat(mobile): implement home track sections
feat(mobile): add global audio player
feat(mobile): add track detail and comments
feat(mobile): implement track search
feat(mobile): add library and playlists
feat(mobile): implement user profile and follow
feat(mobile): add notifications
feat(mobile): add subscription plans
feat(mobile): add artist studio
feat(mobile): implement membership community
feat(mobile): implement ticket collection
feat(mobile): add QR ticket scanner
feat(mobile): add VNPay resume status handling
test(mobile): add provider and widget tests
```

---

# 48. KẾ HOẠCH 2 TUẦN ĐẦU

## Tuần 1

### Ngày 1

Baseline + analyze + test Auth.

### Ngày 2

Theme + shared widgets + TrackModel.

### Ngày 3

Home repository/provider.

### Ngày 4

Home track sections.

### Ngày 5

Player service/provider.

### Ngày 6

Mini Player.

### Ngày 7

Now Playing + seek + queue.

## Tuần 2

### Ngày 8

Track Detail.

### Ngày 9

Like + Comments.

### Ngày 10

Search.

### Ngày 11

Library Liked + History.

### Ngày 12

Playlist.

### Ngày 13

Profile + Follow.

### Ngày 14

Regression + cleanup + docs.

## Sau 2 tuần

Lúc này Mobile phải có core music app thật:

```text
Login
Home
Search
Player
Track Detail
Like
Comment
Library
Playlist
Profile
Follow
```

Sau đó mới vào:

```text
Notifications
Subscription
Artist Studio
Membership
Ticket
QR
Payment hardening
```

---

# 49. NHỮNG THỨ CHƯA NÊN REFACTOR

## Không xóa `ApiService` lớn ngay

Dù 2000+ lines là lớn, hiện nó giúp giữ parity API.

Tách dần khi:

```text
Feature đã chạy
Test ổn
Repository đã ổn định
```

## Không đổi Riverpod sang state management khác

Không có lợi ích đủ lớn để đổi.

## Không đổi GoRouter

StatefulShellRoute hiện phù hợp.

## Không thay Dio bằng package khác

DioClient hiện đã có refresh flow tốt.

## Không rewrite Auth

Chỉ sửa text/user experience và thêm test.

## Không cố copy Web 1:1

Web layout desktop không phải mobile layout.

Mirror:

```text
business flow
API
permission
state
```

Không bắt buộc mirror pixel.

---

# 50. CHECKLIST BÀN GIAO CUỐI CÙNG

Developer tiếp theo trước khi code phải đọc:

```text
lib/main.dart
lib/core/config/api_config.dart
lib/core/network/dio_client.dart
lib/core/router/app_router.dart
lib/core/storage/token_storage.dart

lib/features/auth/
lib/shared/presentation/app_shell.dart

lib/services/api/api_service.dart
lib/services/examples/api_usage_examples.dart
```

Sau đó xác nhận:

- [ ] Hiểu `10.0.2.2`.
- [ ] Hiểu ApiConfig.
- [ ] Hiểu token storage.
- [ ] Hiểu auto refresh 401.
- [ ] Hiểu Riverpod auth.
- [ ] Hiểu StatefulShellRoute.
- [ ] Biết Home hiện chưa hoàn chỉnh.
- [ ] Biết Search/Library/Profile còn placeholder.
- [ ] Biết ApiService đã có nhiều API.
- [ ] Không gọi API trực tiếp trong build.
- [ ] Không load tất cả dữ liệu khi có pagination.
- [ ] User-facing UI phải English.
- [ ] Test Payment chỉ DEV.
- [ ] VNPay vẫn là payment chính.
- [ ] Backend là nguồn business truth.
- [ ] Không đưa secret vào Flutter.
- [ ] Player phải global.
- [ ] QR scanner phải debounce.
- [ ] Payment phải verify status từ Backend.
- [ ] Mỗi feature phải có loading/error/empty/success.
- [ ] `flutter analyze` phải pass trước commit.

---

# KẾT LUẬN

SoundClone Mobile hiện đã có **foundation tốt**, đặc biệt ở:

```text
Authentication
Secure token storage
Dio interceptor
Token refresh
Riverpod
GoRouter
Bottom navigation shell
API service parity
```

Điểm còn thiếu lớn nhất không phải Backend API mà là **feature UI + typed state + global player**.

Vì vậy thứ tự phát triển đúng nhất là:

```text
Không rewrite foundation
        ↓
Xây Home thật
        ↓
Xây Global Player
        ↓
Track/Search/Library/Profile
        ↓
Social/Notification
        ↓
Subscription/Artist Studio
        ↓
Membership
        ↓
Ticket/QR
        ↓
Payment hardening
        ↓
Testing + Release
```

Nếu làm theo đúng thứ tự trên, Mobile sẽ tiến dần từ một **authenticated Flutter shell** thành một **SoundClone music client hoàn chỉnh**, trong khi vẫn tái sử dụng toàn bộ business logic đã xây ở Spring Boot Backend.

---

## GHI CHÚ AUDIT

Tài liệu này được viết dựa trên snapshot `master/Mobile` kiểm tra ngày **10/08/2026**.

Các file được audit trực tiếp gồm:

```text
Mobile/pubspec.yaml
Mobile/lib/main.dart

Mobile/lib/core/config/api_config.dart
Mobile/lib/core/network/dio_client.dart
Mobile/lib/core/router/app_router.dart
Mobile/lib/core/storage/token_storage.dart

Mobile/lib/features/auth/data/auth_service.dart
Mobile/lib/features/auth/providers/auth_provider.dart
Mobile/lib/features/auth/presentation/auth_gate.dart
Mobile/lib/features/home/presentation/home_screen.dart

Mobile/lib/shared/presentation/app_shell.dart

Mobile/lib/services/api/api_service.dart
Mobile/lib/services/examples/api_usage_examples.dart
```

Khi Backend hoặc Web API thay đổi, phải cập nhật `ApiService` và tài liệu này cùng lúc.

///// api usage
/*
 * =====================================================================
 * HƯỚNG DẪN SỬ DỤNG SOUNDCLONE MOBILE API SERVICE - TIẾNG VIỆT
 * =====================================================================
 *
 * File này vừa là API client, vừa là API catalog cho Mobile.
 *
 * NGUỒN ĐỐI CHIẾU:
 * - Flutter Mobile api_service.dart hiện tại.
 * - Web src/utils/api.ts được cung cấp cùng lần audit.
 * - Backend dùng prefix /api/v1.
 *
 * ---------------------------------------------------------------------
 * 1. CÁCH LẤY INSTANCE
 * ---------------------------------------------------------------------
 *
 *   final api = ApiService.instance;
 *
 * Không tạo:
 *
 *   ApiService();
 *
 * vì constructor là private và project dùng singleton.
 *
 * ---------------------------------------------------------------------
 * 2. TOKEN CÓ CẦN TRUYỀN TAY KHÔNG?
 * ---------------------------------------------------------------------
 *
 * KHÔNG.
 *
 * DioClient tự:
 * - đọc access token từ TokenStorage;
 * - thêm Authorization: Bearer <token>;
 * - gặp 401 thì refresh token;
 * - retry request đúng một lần.
 *
 * Vì vậy Mobile call:
 *
 *   await api.getMyTracksApi();
 *
 * thay vì:
 *
 *   await api.getMyTracksApi(accessToken);
 *
 * ---------------------------------------------------------------------
 * 3. CÁCH KIỂM TRA RESPONSE
 * ---------------------------------------------------------------------
 *
 *   final response = await api.getTracksApi(
 *     current: 1,
 *     pageSize: 10,
 *   );
 *
 *   if (!response.isSuccess) {
 *     debugPrint(
 *       'HTTP ${response.statusCode}: ${response.message}',
 *     );
 *     return;
 *   }
 *
 *   final data = response.data;
 *
 * Các helper:
 *
 *   response.isSuccess
 *   response.isUnauthorized
 *   response.isForbidden
 *   response.isNotFound
 *   response.isConflict
 *   response.isNetworkError
 *
 * ---------------------------------------------------------------------
 * 4. CÁCH LẤY LIST TỪ RESPONSE KHÔNG ĐỒNG NHẤT
 * ---------------------------------------------------------------------
 *
 * Một số Backend response:
 *
 *   data: [...]
 *
 * Một số:
 *
 *   data: {
 *     result: [...]
 *   }
 *
 * Một số:
 *
 *   data: {
 *     items: [...]
 *   }
 *
 * Có thể dùng:
 *
 *   final items = api.extractResultList(response);
 *
 * ---------------------------------------------------------------------
 * 5. PUBLIC API VÀ PROTECTED API
 * ---------------------------------------------------------------------
 *
 * Public API:
 * - có thể gọi khi chưa login.
 *
 * Protected API:
 * - Backend yêu cầu JWT.
 * - Mobile KHÔNG truyền token tay.
 * - DioClient tự gắn token nếu TokenStorage có access token.
 *
 * Nếu protected API trả 401:
 * - DioClient tự thử refresh.
 * - refresh fail -> clear token.
 *
 * ---------------------------------------------------------------------
 * 6. FILE / MULTIPART
 * ---------------------------------------------------------------------
 *
 * Ví dụ upload ảnh:
 *
 *   final image = File('/path/avatar.jpg');
 *   final response = await api.uploadImageApi(image);
 *
 * Ví dụ tạo track:
 *
 *   final response = await api.createTrackApi(
 *     fields: {
 *       'title': 'My Track',
 *       'categoryId': categoryId,
 *       'isPublic': true,
 *     },
 *     files: {
 *       'audioFile': audioFile,
 *       'imageFile': imageFile,
 *     },
 *   );
 *
 * TÊN KEY multipart phải khớp Backend Controller hiện tại.
 *
 * ---------------------------------------------------------------------
 * 7. PAYMENT
 * ---------------------------------------------------------------------
 *
 * VNPay vẫn là payment chính.
 *
 * Prefix:
 *
 *   SC...  -> account subscription
 *   SCM... -> artist membership
 *   SCT... -> ticket
 *
 * Unified status:
 *
 *   await api.getPaymentApi(orderCode);
 *
 * Test Payment DEV/LOCAL:
 *
 *   SCT -> completeTestTicketPaymentApi()
 *   SCM -> completeTestMembershipPaymentApi()
 *
 * Không dùng test payment cho production.
 *
 * ---------------------------------------------------------------------
 * 8. ARTIST PRO DEMO
 * ---------------------------------------------------------------------
 *
 * Artist Pro Demo KHÔNG qua VNPay:
 *
 *   final response = await api.changeSubscriptionPlanApi(
 *     'ARTIST_PRO_DEMO',
 *   );
 *
 * Backend quyết định thời hạn 7 ngày.
 *
 * ---------------------------------------------------------------------
 * 9. WEB-ONLY KHÔNG PORT
 * ---------------------------------------------------------------------
 *
 * /api/revalidate là API nội bộ Next.js.
 * Flutter tuyệt đối không gọi endpoint này.
 *
 * ---------------------------------------------------------------------
 * 10. CÁC FALLBACK CẦN CHÚ Ý
 * ---------------------------------------------------------------------
 *
 * getTracksByUserApi():
 * - Backend chưa có public GET /users/{id}/tracks.
 * - Mobile lấy public tracks rồi filter local.
 * - Chỉ là compatibility fallback.
 *
 * getUserPlaylistsApi()/getUserAlbumsApi():
 * - Backend chưa có public playlist theo user.
 * - Mobile lấy page lớn rồi filter local.
 *
 * getUserLikedTracksApi(userId):
 * - Backend chỉ cho liked tracks của current user.
 * - userId không tạo quyền xem liked tracks của user khác.
 *
 * ---------------------------------------------------------------------
 * 11. AUDIT WEB vs MOBILE
 * ---------------------------------------------------------------------
 * ✅ Sau các bổ sung trong bản này, không còn thiếu business API
 *    nào được khai báo trong Web api.ts đã cung cấp.
 *
 * KHÔNG PORT CÓ CHỦ ĐÍCH:
 * - revalidateApi(): route nội bộ Next.js /api/revalidate.
 * - sendRequest()/sendRequestFile(): Mobile dùng _request() + DioClient.
 * - convertSlugUrl(): helper UI Web, không phải Backend API.
 *
 * KHÁC TÊN NHƯNG CÙNG CHỨC NĂNG:
 * - loginAPI -> loginApi
 * - verifyRegisterOtpAPI -> verifyRegisterOtpApi
 * - getArtistLeaderboard -> getArtistLeaderboardApi
 * - getCategories -> getCategoriesApi
 * - getTracksByCategory -> getTracksByCategoryApi
 *
 * =====================================================================
 * API INDEX + CÁCH CALL TẤT CẢ API
 * =====================================================================
 *
 * Quy ước biến ví dụ:
 *
 *   final api = ApiService.instance;
 *   final payload = <String, dynamic>{};
 *   final fields = <String, dynamic>{};
 *   final files = <String, File>{};
 *   final imageFile = File('/path/image.jpg');
 *   final userId = 'USER_ID';
 *   final trackId = 'TRACK_ID';
 *   final playlistId = 'PLAYLIST_ID';
 *   final artistId = 'ARTIST_ID';
 *   final eventId = 'EVENT_ID';
 *   final ticketId = 'TICKET_ID';
 *   final postId = 'POST_ID';
 *   final commentId = 'COMMENT_ID';
 *   final planId = 'PLAN_ID';
 *   final benefitId = 'BENEFIT_ID';
 *   final notificationId = 'NOTIFICATION_ID';
 *   final payoutRequestId = 'PAYOUT_REQUEST_ID';
 *   final subscriptionId = 'SUBSCRIPTION_ID';
 *   final categoryId = 'CATEGORY_ID';
 *   final trackIds = <String>['TRACK_1', 'TRACK_2'];
 *
 * ---------------------------------------------------------------------
 * AUTH
 * ---------------------------------------------------------------------
 *
 * loginApi
 *   final response = await api.loginApi(email: 'user@example.com', password: 'Password123!');
 *
 * getAccountApi
 *   final response = await api.getAccountApi();
 *
 * refreshTokenApi
 *   final response = await api.refreshTokenApi('refreshToken');
 *
 * logoutApi
 *   final response = await api.logoutApi();
 *
 * socialMediaLoginApi
 *   final response = await api.socialMediaLoginApi(type: 'GOOGLE');
 *
 * registerApi
 *   final response = await api.registerApi(
 *       name: 'Demo User',
 *       email: 'user@example.com',
 *       password: 'Password123!',
 *     );
 *
 * registerWithOtpApi
 *   final response = await api.registerWithOtpApi(
 *       name: 'Demo User',
 *       email: 'user@example.com',
 *       password: 'Password123!',
 *     );
 *
 * verifyRegisterOtpApi
 *   final response = await api.verifyRegisterOtpApi(email: 'user@example.com', otp: '123456');
 *
 * resendRegisterOtpApi
 *   final response = await api.resendRegisterOtpApi(email: 'user@example.com');
 *
 * forgotPasswordApi
 *   final response = await api.forgotPasswordApi(email: 'user@example.com');
 *
 * resetPasswordApi
 *   final response = await api.resetPasswordApi(
 *       email: 'user@example.com',
 *       otp: '123456',
 *       newPassword: 'NewPassword123!',
 *     );
 *
 * ---------------------------------------------------------------------
 * USERS
 * ---------------------------------------------------------------------
 *
 * getAllUsersApi
 *   final response = await api.getAllUsersApi();
 *
 * getUsersApi
 *   final response = await api.getUsersApi();
 *
 * getUserByIdApi
 *   final response = await api.getUserByIdApi(userId);
 *
 * createUserApi
 *   final response = await api.createUserApi(payload);
 *
 * updateUserApi
 *   final response = await api.updateUserApi(userId: userId, payload: payload);
 *
 * updateMyProfileApi
 *   final response = await api.updateMyProfileApi();
 *
 * deleteUserApi
 *   final response = await api.deleteUserApi(userId);
 *
 * getArtistLeaderboardApi
 *   final response = await api.getArtistLeaderboardApi();
 *
 * getWhoToFollowApi
 *   final response = await api.getWhoToFollowApi();
 *
 * getUserBadgesApi
 *   final response = await api.getUserBadgesApi(userId);
 *
 * ---------------------------------------------------------------------
 * FOLLOW
 * ---------------------------------------------------------------------
 *
 * followUserApi
 *   final response = await api.followUserApi(userId);
 *
 * unfollowUserApi
 *   final response = await api.unfollowUserApi(userId);
 *
 * getFollowStatusApi
 *   final response = await api.getFollowStatusApi(userId);
 *
 * getUserFollowingApi
 *   final response = await api.getUserFollowingApi(userId: userId);
 *
 * getUserFollowersApi
 *   final response = await api.getUserFollowersApi(userId: userId);
 *
 * getMyFollowingApi
 *   final response = await api.getMyFollowingApi();
 *
 * getMyFollowersApi
 *   final response = await api.getMyFollowersApi();
 *
 * ---------------------------------------------------------------------
 * TRACKS
 * ---------------------------------------------------------------------
 *
 * getTracksApi
 *   final response = await api.getTracksApi();
 *
 * getAllTracksApi
 *   final response = await api.getAllTracksApi();
 *
 * getTrackByIdApi
 *   final response = await api.getTrackByIdApi(trackId);
 *
 * getTrackBySlugOrIdApi
 *   final response = await api.getTrackBySlugOrIdApi('track-slug-or-id');
 *
 * getTopTracksApi
 *   final response = await api.getTopTracksApi(category: 'ncs');
 *
 * getTrackCommentsApi
 *   final response = await api.getTrackCommentsApi(trackId);
 *
 * getMyTracksApi
 *   final response = await api.getMyTracksApi();
 *
 * getMyStudioTracksApi
 *   final response = await api.getMyStudioTracksApi();
 *
 * searchTracksApi
 *   final response = await api.searchTracksApi('music');
 *
 * createAlbumApi
 *   final response = await api.createAlbumApi(title: 'My Playlist', trackIds: trackIds);
 *
 * createTrackApi
 *   final response = await api.createTrackApi(fields: fields, files: imageFile);
 *
 * updateTrackApi
 *   final response = await api.updateTrackApi(trackId: trackId, fields: fields);
 *
 * deleteTrackApi
 *   final response = await api.deleteTrackApi(trackId);
 *
 * getTracksByUserApi
 *   final response = await api.getTracksByUserApi(userId: userId);
 *
 * ---------------------------------------------------------------------
 * ADMIN TRACK
 * ---------------------------------------------------------------------
 *
 * getAdminTracksApi
 *   final response = await api.getAdminTracksApi();
 *
 * approveTrackApi
 *   final response = await api.approveTrackApi(trackId);
 *
 * rejectTrackApi
 *   final response = await api.rejectTrackApi(trackId: trackId, reason: 'Reason for this action');
 *
 * approveTrackLicenseApi
 *   final response = await api.approveTrackLicenseApi(trackId);
 *
 * rejectTrackLicenseApi
 *   final response = await api.rejectTrackLicenseApi(trackId: trackId, reason: 'Reason for this action');
 *
 * scanTrackCopyrightApi
 *   final response = await api.scanTrackCopyrightApi(trackId);
 *
 * ---------------------------------------------------------------------
 * UPLOAD
 * ---------------------------------------------------------------------
 *
 * uploadImageApi
 *   final response = await api.uploadImageApi(imageFile);
 *
 * uploadTrackFileApi
 *   final response = await api.uploadTrackFileApi(imageFile);
 *
 * ---------------------------------------------------------------------
 * COMMENTS
 * ---------------------------------------------------------------------
 *
 * getCommentsApi
 *   final response = await api.getCommentsApi();
 *
 * createTrackCommentApi
 *   final response = await api.createTrackCommentApi(trackId: trackId, content: 'Great track!');
 *
 * createCommentApi
 *   final response = await api.createCommentApi(payload);
 *
 * deleteCommentApi
 *   final response = await api.deleteCommentApi(commentId);
 *
 * ---------------------------------------------------------------------
 * PLAYLIST
 * ---------------------------------------------------------------------
 *
 * createEmptyPlaylistApi
 *   final response = await api.createEmptyPlaylistApi(title: 'My Playlist');
 *
 * updatePlaylistApi
 *   final response = await api.updatePlaylistApi(playlistId: playlistId, payload: payload);
 *
 * deletePlaylistApi
 *   final response = await api.deletePlaylistApi(playlistId);
 *
 * getPlaylistByIdApi
 *   final response = await api.getPlaylistByIdApi(playlistId);
 *
 * getPlaylistsApi
 *   final response = await api.getPlaylistsApi();
 *
 * getMyPlaylistsApi
 *   final response = await api.getMyPlaylistsApi();
 *
 * getPlaylistsByUserApi
 *   final response = await api.getPlaylistsByUserApi();
 *
 * getUserPlaylistsApi
 *   final response = await api.getUserPlaylistsApi(userId);
 *
 * getUserAlbumsApi
 *   final response = await api.getUserAlbumsApi(userId);
 *
 * ---------------------------------------------------------------------
 * LIKE
 * ---------------------------------------------------------------------
 *
 * likeTrackApi
 *   final response = await api.likeTrackApi(trackId);
 *
 * dislikeTrackApi
 *   final response = await api.dislikeTrackApi(trackId);
 *
 * getLikedTracksApi
 *   final response = await api.getLikedTracksApi();
 *
 * getUserLikedTracksApi
 *   final response = await api.getUserLikedTracksApi(userId);
 *
 * ---------------------------------------------------------------------
 * CATEGORY
 * ---------------------------------------------------------------------
 *
 * getCategoriesApi
 *   final response = await api.getCategoriesApi();
 *
 * getAllCategoriesApi
 *   final response = await api.getAllCategoriesApi();
 *
 * getCategoryByIdApi
 *   final response = await api.getCategoryByIdApi(categoryId);
 *
 * getCategoryBySlugApi
 *   final response = await api.getCategoryBySlugApi('track-slug-or-id');
 *
 * createCategoryApi
 *   final response = await api.createCategoryApi(payload);
 *
 * updateCategoryApi
 *   final response = await api.updateCategoryApi(categoryId: categoryId, payload: payload);
 *
 * deleteCategoryApi
 *   final response = await api.deleteCategoryApi(categoryId);
 *
 * getTracksByCategoryApi
 *   final response = await api.getTracksByCategoryApi('ncs');
 *
 * ---------------------------------------------------------------------
 * LISTENING / HOME
 * ---------------------------------------------------------------------
 *
 * saveListeningProgressApi
 *   final response = await api.saveListeningProgressApi(
 *       trackId: trackId,
 *       position: 30,
 *       duration: 180,
 *       completed: false,
 *       playing: true,
 *     );
 *
 * getHomeListeningHistoryApi
 *   final response = await api.getHomeListeningHistoryApi();
 *
 * getBecauseYouListenedApi
 *   final response = await api.getBecauseYouListenedApi();
 *
 * getHiddenGemsApi
 *   final response = await api.getHiddenGemsApi();
 *
 * ---------------------------------------------------------------------
 * SUBSCRIPTION
 * ---------------------------------------------------------------------
 *
 * getSubscriptionPlansApi
 *   final response = await api.getSubscriptionPlansApi();
 *
 * getMySubscriptionApi
 *   final response = await api.getMySubscriptionApi();
 *
 * getMySubscriptionUsageApi
 *   final response = await api.getMySubscriptionUsageApi();
 *
 * subscribePlanApi
 *   final response = await api.subscribePlanApi('ARTIST_PRO');
 *
 * changeSubscriptionPlanApi
 *   final response = await api.changeSubscriptionPlanApi('ARTIST_PRO');
 *
 * cancelSubscriptionApi
 *   final response = await api.cancelSubscriptionApi();
 *
 * ---------------------------------------------------------------------
 * ARTIST STUDIO / BENEFITS
 * ---------------------------------------------------------------------
 *
 * getArtistBenefitsApi
 *   final response = await api.getArtistBenefitsApi();
 *
 * getArtistStudioStatsApi
 *   final response = await api.getArtistStudioStatsApi();
 *
 * getAdminArtistBenefitsApi
 *   final response = await api.getAdminArtistBenefitsApi();
 *
 * createAdminArtistBenefitApi
 *   final response = await api.createAdminArtistBenefitApi(payload);
 *
 * updateAdminArtistBenefitApi
 *   final response = await api.updateAdminArtistBenefitApi(benefitId: benefitId, payload: payload);
 *
 * toggleAdminArtistBenefitApi
 *   final response = await api.toggleAdminArtistBenefitApi(benefitId);
 *
 * deleteAdminArtistBenefitApi
 *   final response = await api.deleteAdminArtistBenefitApi(benefitId);
 *
 * ---------------------------------------------------------------------
 * NOTIFICATIONS
 * ---------------------------------------------------------------------
 *
 * getNotificationsApi
 *   final response = await api.getNotificationsApi();
 *
 * getUnreadNotificationCountApi
 *   final response = await api.getUnreadNotificationCountApi();
 *
 * markNotificationAsReadApi
 *   final response = await api.markNotificationAsReadApi(notificationId);
 *
 * markAllNotificationsAsReadApi
 *   final response = await api.markAllNotificationsAsReadApi();
 *
 * deleteNotificationApi
 *   final response = await api.deleteNotificationApi(notificationId);
 *
 * clearReadNotificationsApi
 *   final response = await api.clearReadNotificationsApi();
 *
 * ---------------------------------------------------------------------
 * ARTIST WALLET / PAYOUT
 * ---------------------------------------------------------------------
 *
 * getArtistWalletApi
 *   final response = await api.getArtistWalletApi();
 *
 * getArtistEarningHistoryApi
 *   final response = await api.getArtistEarningHistoryApi();
 *
 * getArtistEarningSummaryApi
 *   final response = await api.getArtistEarningSummaryApi();
 *
 * createArtistPayoutRequestApi
 *   final response = await api.createArtistPayoutRequestApi(payload);
 *
 * getArtistPayoutHistoryApi
 *   final response = await api.getArtistPayoutHistoryApi();
 *
 * cancelArtistPayoutRequestApi
 *   final response = await api.cancelArtistPayoutRequestApi(payoutRequestId);
 *
 * getAdminArtistPayoutsApi
 *   final response = await api.getAdminArtistPayoutsApi();
 *
 * getAdminArtistPayoutDetailApi
 *   final response = await api.getAdminArtistPayoutDetailApi(payoutRequestId);
 *
 * approveAdminArtistPayoutApi
 *   final response = await api.approveAdminArtistPayoutApi(payoutRequestId: payoutRequestId);
 *
 * rejectAdminArtistPayoutApi
 *   final response = await api.rejectAdminArtistPayoutApi(payoutRequestId: payoutRequestId, payload: payload);
 *
 * markAdminArtistPayoutPaidApi
 *   final response = await api.markAdminArtistPayoutPaidApi(payoutRequestId: payoutRequestId, payload: payload);
 *
 * getAllPaidAdminArtistPayoutsApi
 *   final response = await api.getAllPaidAdminArtistPayoutsApi();
 *
 * ---------------------------------------------------------------------
 * PAYMENT / EARNING RATE
 * ---------------------------------------------------------------------
 *
 * createVnPayPaymentApi
 *   final response = await api.createVnPayPaymentApi('ARTIST_PRO');
 *
 * getPaymentApi
 *   final response = await api.getPaymentApi('SCT_OR_SCM_ORDER_CODE');
 *
 * getAdminEarningRatesApi
 *   final response = await api.getAdminEarningRatesApi();
 *
 * getActiveAdminEarningRateApi
 *   final response = await api.getActiveAdminEarningRateApi();
 *
 * createAdminEarningRateApi
 *   final response = await api.createAdminEarningRateApi(amountPerStream: 10);
 *
 * ---------------------------------------------------------------------
 * MEMBERSHIP PLAN / ACCESS
 * ---------------------------------------------------------------------
 *
 * getArtistMembershipPlansApi
 *   final response = await api.getArtistMembershipPlansApi(artistId);
 *
 * getMyArtistMembershipPlansApi
 *   final response = await api.getMyArtistMembershipPlansApi();
 *
 * createArtistMembershipPlanApi
 *   final response = await api.createArtistMembershipPlanApi(payload);
 *
 * updateArtistMembershipPlanApi
 *   final response = await api.updateArtistMembershipPlanApi(planId: planId, payload: payload);
 *
 * getArtistMembershipAccessApi
 *   final response = await api.getArtistMembershipAccessApi(artistId);
 *
 * getMyArtistMembershipsApi
 *   final response = await api.getMyArtistMembershipsApi();
 *
 * cancelArtistMembershipApi
 *   final response = await api.cancelArtistMembershipApi(subscriptionId);
 *
 * ---------------------------------------------------------------------
 * MEMBERSHIP POSTS / POLL / COMMENTS
 * ---------------------------------------------------------------------
 *
 * getArtistMembershipPostsApi
 *   final response = await api.getArtistMembershipPostsApi(artistId: artistId);
 *
 * getMyArtistMembershipPostsApi
 *   final response = await api.getMyArtistMembershipPostsApi();
 *
 * createArtistMembershipPostApi
 *   final response = await api.createArtistMembershipPostApi(payload);
 *
 * createArtistMembershipImagePostApi
 *   final response = await api.createArtistMembershipImagePostApi(visibility: 'MEMBERS_ONLY', image: imageFile);
 *
 * createArtistMembershipPollApi
 *   final response = await api.createArtistMembershipPollApi(payload);
 *
 * updateArtistMembershipPostApi
 *   final response = await api.updateArtistMembershipPostApi(postId: postId, payload: payload);
 *
 * replaceArtistMembershipPostImageApi
 *   final response = await api.replaceArtistMembershipPostImageApi(postId: postId, image: imageFile);
 *
 * publishArtistMembershipPostApi
 *   final response = await api.publishArtistMembershipPostApi(postId);
 *
 * archiveArtistMembershipPostApi
 *   final response = await api.archiveArtistMembershipPostApi(postId);
 *
 * deleteArtistMembershipPostApi
 *   final response = await api.deleteArtistMembershipPostApi(postId);
 *
 * getArtistMembershipPollApi
 *   final response = await api.getArtistMembershipPollApi(postId);
 *
 * voteArtistMembershipPollApi
 *   final response = await api.voteArtistMembershipPollApi(postId: postId, payload: payload);
 *
 * getArtistMembershipPostCommentsApi
 *   final response = await api.getArtistMembershipPostCommentsApi(postId: postId);
 *
 * getArtistMembershipCommentRepliesApi
 *   final response = await api.getArtistMembershipCommentRepliesApi(postId: postId, commentId: commentId);
 *
 * createArtistMembershipCommentApi
 *   final response = await api.createArtistMembershipCommentApi(postId: postId, payload: payload);
 *
 * updateArtistMembershipCommentApi
 *   final response = await api.updateArtistMembershipCommentApi(
 *       postId: postId,
 *       commentId: commentId,
 *       payload: payload,
 *     );
 *
 * deleteArtistMembershipCommentApi
 *   final response = await api.deleteArtistMembershipCommentApi(postId: postId, commentId: commentId);
 *
 * ---------------------------------------------------------------------
 * MEMBERSHIP PAYMENT
 * ---------------------------------------------------------------------
 *
 * createArtistMembershipPaymentApi
 *   final response = await api.createArtistMembershipPaymentApi(payload);
 *
 * getArtistMembershipPaymentApi
 *   final response = await api.getArtistMembershipPaymentApi('SCT_OR_SCM_ORDER_CODE');
 *
 * completeTestMembershipPaymentApi
 *   final response = await api.completeTestMembershipPaymentApi(orderCode: 'SCT_OR_SCM_ORDER_CODE', testCode: 'SC_TEST_SUCCESS_123456');
 *
 * ---------------------------------------------------------------------
 * EVENT / TICKET
 * ---------------------------------------------------------------------
 *
 * getPublicArtistEventsApi
 *   final response = await api.getPublicArtistEventsApi(artistId: artistId);
 *
 * getPublicArtistEventApi
 *   final response = await api.getPublicArtistEventApi(eventId);
 *
 * getMyArtistEventsApi
 *   final response = await api.getMyArtistEventsApi();
 *
 * createArtistEventApi
 *   final response = await api.createArtistEventApi(
 *       eventName: 'SoundClone Live',
 *       eventType: 'CONCERT',
 *       venueName: 'Demo Venue',
 *       venueAddress: 'Ho Chi Minh City',
 *       eventStartAt: '2026-08-20T19:00:00',
 *       saleStartAt: '2026-08-20T19:00:00',
 *       saleEndAt: '2026-08-20T19:00:00',
 *       ticketPrice: 100000,
 *       totalQuantity: 100,
 *       ticketImage: imageFile,
 *     );
 *
 * createTicketPaymentApi
 *   final response = await api.createTicketPaymentApi(eventId: eventId, quantity: 1);
 *
 * getTicketPaymentApi
 *   final response = await api.getTicketPaymentApi('SCT_OR_SCM_ORDER_CODE');
 *
 * getMyTicketsApi
 *   final response = await api.getMyTicketsApi();
 *
 * getMyTicketApi
 *   final response = await api.getMyTicketApi(ticketId);
 *
 * getMyTicketQrApi
 *   final response = await api.getMyTicketQrApi(ticketId);
 *
 * checkInTicketApi
 *   final response = await api.checkInTicketApi(payload);
 *
 * completeTestTicketPaymentApi
 *   final response = await api.completeTestTicketPaymentApi(orderCode: 'SCT_OR_SCM_ORDER_CODE', testCode: 'SC_TEST_SUCCESS_123456');
 *
 * ---------------------------------------------------------------------
 * ADMIN TICKET
 * ---------------------------------------------------------------------
 *
 * getAdminTicketEventsApi
 *   final response = await api.getAdminTicketEventsApi();
 *
 * approveArtistTicketEventApi
 *   final response = await api.approveArtistTicketEventApi(eventId);
 *
 * rejectArtistTicketEventApi
 *   final response = await api.rejectArtistTicketEventApi(eventId: eventId, reason: 'Reason for this action');
 *
 * ---------------------------------------------------------------------
 * TEST PAYMENT GENERIC
 * ---------------------------------------------------------------------
 *
 * completeTestPaymentApi
 *   final response = await api.completeTestPaymentApi(orderCode: 'SCT_OR_SCM_ORDER_CODE', testCode: 'SC_TEST_SUCCESS_123456');
 *
 * =====================================================================
 * FLOW MẪU 1 - LOGIN
 * =====================================================================
 *
 *   final api = ApiService.instance;
 *
 *   final response = await api.loginApi(
 *     email: 'user@example.com',
 *     password: 'Password123!',
 *   );
 *
 *   if (!response.isSuccess) {
 *     throw Exception(response.message);
 *   }
 *
 *   // loginApi() tự save access/refresh token.
 *
 * =====================================================================
 * FLOW MẪU 2 - HOME
 * =====================================================================
 *
 *   final history = await api.getHomeListeningHistoryApi(
 *     limit: 10,
 *   );
 *
 *   final because = await api.getBecauseYouListenedApi(
 *     limit: 10,
 *   );
 *
 *   final hidden = await api.getHiddenGemsApi(
 *     limit: 8,
 *     maxPlays: 1000,
 *   );
 *
 *   final ncs = await api.getTopTracksApi(
 *     category: 'ncs',
 *     limit: 6,
 *   );
 *
 * Không load toàn bộ track rồi slice nếu Backend đã support limit.
 *
 * =====================================================================
 * FLOW MẪU 3 - PLAY TRACK + LISTENING HISTORY
 * =====================================================================
 *
 *   final trackResponse = await api.getTrackByIdApi(trackId);
 *
 *   if (trackResponse.isSuccess) {
 *     final track = api.normalizeTrack(trackResponse.data);
 *     final audioUrl = api.getAudioUrl(
 *       track?['trackUrl']?.toString(),
 *     );
 *
 *     // Player load audioUrl...
 *   }
 *
 * Khi đạt listening threshold:
 *
 *   await api.saveListeningProgressApi(
 *     trackId: trackId,
 *     position: 35,
 *     duration: 180,
 *     completed: false,
 *     playing: true,
 *     sessionId: 'PLAYBACK_SESSION_ID',
 *   );
 *
 * Không POST history sau mỗi tick player.
 *
 * =====================================================================
 * FLOW MẪU 4 - ARTIST PRO DEMO
 * =====================================================================
 *
 *   final response = await api.changeSubscriptionPlanApi(
 *     'ARTIST_PRO_DEMO',
 *   );
 *
 *   if (response.isSuccess) {
 *     final refreshed = await api.getMySubscriptionApi();
 *   }
 *
 * Demo:
 * - active trực tiếp;
 * - không VNPay;
 * - Backend quản lý 7-day expiration.
 *
 * =====================================================================
 * FLOW MẪU 5 - MEMBERSHIP PURCHASE QUA VNPAY
 * =====================================================================
 *
 *   final create = await api.createArtistMembershipPaymentApi({
 *     'planId': planId,
 *     'locale': 'en',
 *   });
 *
 *   if (!create.isSuccess) {
 *     throw Exception(create.message);
 *   }
 *
 *   final payment = create.data as Map;
 *   final orderCode = payment['orderCode']?.toString() ?? '';
 *   final paymentUrl = payment['paymentUrl']?.toString() ?? '';
 *
 *   // 1. mở paymentUrl bằng url_launcher
 *   // 2. khi app resume/deep-link:
 *
 *   final status = await api.getArtistMembershipPaymentApi(
 *     orderCode,
 *   );
 *
 * =====================================================================
 * FLOW MẪU 6 - MEMBERSHIP TEST PURCHASE
 * =====================================================================
 *
 * Chỉ khi ApiConfig.paymentTestMode == true.
 *
 *   final create = await api.createArtistMembershipPaymentApi({
 *     'planId': planId,
 *     'locale': 'en',
 *   });
 *
 *   final payment = create.data as Map;
 *   final orderCode = payment['orderCode'].toString();
 *
 *   final completed =
 *       await api.completeTestMembershipPaymentApi(
 *     orderCode: orderCode,
 *     testCode: 'SC_TEST_SUCCESS_123456',
 *   );
 *
 * Backend vẫn chạy activation/ledger/wallet thật.
 *
 * =====================================================================
 * FLOW MẪU 7 - TICKET PURCHASE
 * =====================================================================
 *
 *   final create = await api.createTicketPaymentApi(
 *     eventId: eventId,
 *     quantity: 2,
 *   );
 *
 *   final payment = create.data as Map;
 *   final orderCode = payment['orderCode']?.toString() ?? '';
 *   final paymentUrl = payment['paymentUrl']?.toString() ?? '';
 *
 *   // VNPay -> return/resume -> verify:
 *
 *   final status = await api.getTicketPaymentApi(
 *     orderCode,
 *   );
 *
 * =====================================================================
 * FLOW MẪU 8 - TICKET TEST PAYMENT
 * =====================================================================
 *
 *   final create = await api.createTicketPaymentApi(
 *     eventId: eventId,
 *     quantity: 1,
 *   );
 *
 *   final payment = create.data as Map;
 *   final orderCode = payment['orderCode'].toString();
 *
 *   final completed = await api.completeTestTicketPaymentApi(
 *     orderCode: orderCode,
 *     testCode: 'SC_TEST_SUCCESS_123456',
 *   );
 *
 * Sau success:
 *
 *   final tickets = await api.getMyTicketsApi();
 *
 * =====================================================================
 * FLOW MẪU 9 - TICKET QR
 * =====================================================================
 *
 *   final qr = await api.getMyTicketQrApi(ticketId);
 *
 *   if (!qr.isSuccess) {
 *     // show error
 *   }
 *
 * QR scanner của Artist/Admin:
 *
 *   final checkedIn = await api.checkInTicketApi({
 *     'qrToken': 'TOKEN_FROM_CAMERA',
 *   });
 *
 * Camera trả nhiều frame.
 * Screen phải khóa/debounce để một QR không gửi nhiều request check-in.
 *
 * =====================================================================
 * FLOW MẪU 10 - MEMBERSHIP TRACK PREVIEW
 * =====================================================================
 *
 * Artist lấy own tracks:
 *
 *   final tracks = await api.getMyTracksApi();
 *
 * Sau đó tạo post bằng payload đúng DTO Backend:
 *
 *   final post = await api.createArtistMembershipPostApi({
 *     'type': 'TRACK_PREVIEW',
 *     'visibility': 'MEMBERS_ONLY',
 *     'trackId': trackId,
 *     'previewStartSeconds': 30,
 *     'previewDurationSeconds': 60,
 *     'allowComments': true,
 *   });
 *
 * Khi member play:
 *
 *   start = 30s
 *   stop boundary = 30 + 60 = 90s
 *
 * Backend vẫn là nơi quyết định user có quyền xem/nghe post hay không.
 *
 * =====================================================================
 * FLOW MẪU 11 - PAGINATION
 * =====================================================================
 *
 *   var current = 1;
 *
 *   final response = await api.getTracksApi(
 *     current: current,
 *     pageSize: 20,
 *   );
 *
 * Khi scroll:
 *
 *   current += 1;
 *
 *   final next = await api.getTracksApi(
 *     current: current,
 *     pageSize: 20,
 *   );
 *
 * Guard:
 * - đang loadingMore -> không gọi tiếp;
 * - hết page -> không gọi tiếp.
 *
 * =====================================================================
 * FLOW MẪU 12 - ERROR HANDLING
 * =====================================================================
 *
 *   final response = await api.getMyTicketsApi();
 *
 *   if (response.isUnauthorized) {
 *     // auth/session problem
 *   } else if (response.isForbidden) {
 *     // role/permission problem
 *   } else if (response.isConflict) {
 *     // business conflict: already used, invalid state, duplicate...
 *   } else if (response.isNetworkError) {
 *     // backend offline / emulator connection / timeout
 *   } else if (!response.isSuccess) {
 *     // show response.message
 *   }
 *
 * =====================================================================
 * QUY TẮC CUỐI
 * =====================================================================
 *
 * 1. Screen không gọi DioClient trực tiếp nếu ApiService đã có method.
 * 2. Không truyền access token tay.
 * 3. Không fake payment/membership/ticket status ở Mobile.
 * 4. Không gọi Next.js /api/revalidate.
 * 5. Không load all dữ liệu nếu endpoint support pagination/limit.
 * 6. Mutation phải khóa double-tap.
 * 7. QR scanner phải debounce.
 * 8. Test Payment chỉ bật DEV/LOCAL.
 * 9. Production dùng PAYMENT_TEST_MODE=false.
 * 10. Sau khi Web thêm API mới, đối chiếu ApiService Mobile cùng commit.
 */

