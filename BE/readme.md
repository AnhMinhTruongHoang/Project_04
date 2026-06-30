# SoundClone Backend

Backend cho dự án SoundClone, dùng Spring Boot + MySQL. Backend quản lý người dùng, track nhạc, category, playlist, comment, like, upload ảnh/audio và admin duyệt bài hát.

---

## 1. Công nghệ sử dụng

- Java Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- MySQL
- XAMPP
- Maven Wrapper
- JWT Authentication
- Multipart Upload
- BCrypt Password Hashing

---

## 2. Yêu cầu cài đặt

Cần cài trước:

- Java JDK 17 hoặc mới hơn
- XAMPP
- MySQL
- Maven Wrapper đã có sẵn trong project
- IDE: IntelliJ IDEA / Eclipse / VS Code

---

## 3. Cấu trúc thư mục backend

```txt
BE 02/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/example/demo/
│       │       ├── configs/
│       │       │   └── DataSeeder.java
│       │       ├── controllers/
│       │       │   ├── admin/
│       │       │   │   └── AdminTrackController.java
│       │       │   └── TrackController.java
│       │       ├── dtos/
│       │       ├── entities/
│       │       ├── helpers/
│       │       ├── repositories/
│       │       ├── responses/
│       │       └── services/
│       └── resources/
│           └── application.properties
├── uploads/
│   ├── images/
│   └── audio/
├── mvnw
├── mvnw.cmd
└── pom.xml
```

---

## 4. Cấu hình database mặc định

Database mặc định:

```txt
host: localhost
port: 3306
database: soundclone
username: root
password: empty
```

Trong `application.properties`, cấu hình thường dùng:

```properties
server.port=8000

spring.datasource.url=jdbc:mysql://localhost:3306/soundclone?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.enable_lazy_load_no_trans=true
spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
spring.jpa.open-in-view=false

images_url=http://localhost:8000/uploads/images/
audio_url=http://localhost:8000/uploads/audio/

spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB
```

---

## 5. Cách chạy backend

### Bước 1: Start MySQL trong XAMPP

Mở XAMPP và start:

```txt
Apache
MySQL
```

Sau đó mở:

```txt
http://localhost/phpmyadmin
```

---

### Bước 2: Tạo database

Có thể tạo bằng phpMyAdmin hoặc chạy SQL:

```sql
CREATE DATABASE soundclone
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Nếu muốn reset sạch database:

```sql
DROP DATABASE soundclone;

CREATE DATABASE soundclone
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

### Bước 3: Chạy backend

Mở PowerShell tại thư mục project:

```powershell
cd "BE 02"
.\mvnw.cmd spring-boot:run
```

Backend chạy tại:

```txt
http://localhost:8000
```

---

## 6. Nếu MySQL root có password

Nếu MySQL của bạn có mật khẩu, set biến môi trường trước khi chạy backend.

PowerShell:

```powershell
$env:DB_PASSWORD="your_password"
.\mvnw.cmd spring-boot:run
```

Nếu username không phải `root`:

```powershell
$env:DB_USERNAME="your_username"
$env:DB_PASSWORD="your_password"
.\mvnw.cmd spring-boot:run
```

---

## 7. Tài khoản mặc định sau khi seed

Khi backend chạy lần đầu, `DataSeeder.java` sẽ tạo sẵn user.

### Admin

```txt
email: admin@gmail.com
password: 123456
role: ADMIN
```

### Demo User

```txt
email: user@gmail.com
password: 123456
role: USER
```

### Artist seed

Các artist được tạo tự động theo track seed.

Password mặc định:

```txt
123456
```

Ví dụ:

```txt
blackpink@gmail.com
sontungmtp@gmail.com
unknownbrain@gmail.com
```

---

## 8. Upload folder

Backend lưu file upload tại:

```txt
uploads/images/
uploads/audio/
```

Ảnh được trả về qua:

```txt
http://localhost:8000/uploads/images/{fileName}
```

Audio được trả về qua:

```txt
http://localhost:8000/uploads/audio/{fileName}
```

Nếu ảnh/audio không hiện, kiểm tra:

```txt
BE 02/uploads/images/
BE 02/uploads/audio/
```

và kiểm tra file có tồn tại thật không.

---

## 9. Cấu trúc database và công dụng từng table

### 9.1. `users`

Lưu thông tin người dùng, admin và artist.

Công dụng:

- Đăng nhập
- Phân quyền USER / ADMIN
- Lưu artist
- Lưu avatar
- Theo dõi follower/following
- Quan hệ với track upload
- Quan hệ với track đã like

Các field chính:

```txt
id              ID user, dài 24 ký tự
email           Email đăng nhập
username        Username, thường bằng email
password        Mật khẩu đã hash bằng BCrypt
name            Tên hiển thị
role            ADMIN hoặc USER
type            SYSTEM hoặc ARTIST
avatarUrl       Link avatar
address         Địa chỉ
age             Tuổi
gender          Giới tính
isVerify        Trạng thái xác thực tài khoản
followers       Số người theo dõi
following       Số người đang theo dõi
refreshToken    Token refresh
code            Code verify/reset nếu có
createdAt       Ngày tạo
updatedAt       Ngày cập nhật
```

---

### 9.2. `categories`

Lưu thể loại nhạc.

Công dụng:

- Tách category ra khỏi bảng `tracks`
- Quản lý danh mục nhạc độc lập
- Một category có thể có nhiều track
- Có thể seed category chưa có track nào

Các field chính:

```txt
id              ID category, dài 24 ký tự
name            Tên category, ví dụ NCS, KPOP, POP
slug            Slug category, ví dụ ncs, kpop, pop
description     Mô tả category
isDeleted       Soft delete
createdAt       Ngày tạo
updatedAt       Ngày cập nhật
```

Ví dụ category:

```txt
ncs
kpop
lofi
pop
vpop
edm
chill
workout
party
remix
rap
rock
acoustic
instrumental
ballad
indie
rnb
```

---

### 9.3. `tracks`

Lưu bài hát.

Công dụng:

- Lưu thông tin bài nhạc
- Lưu ảnh thumbnail
- Lưu file audio
- Lưu uploader
- Lưu category bằng `categoryId`
- Lưu trạng thái duyệt bài
- Lưu số lượt nghe và lượt like

Các field chính:

```txt
id              ID track, dài 24 ký tự
title           Tên bài hát
slug            Slug detail page
description     Thường dùng làm artist name
categoryId      FK tới bảng categories
imgUrl          File ảnh hoặc link ảnh
trackUrl        File audio hoặc link audio
countLike       Số lượt like
countPlay       Số lượt nghe
uploaderId      FK tới users.id
approvalStatus  PENDING / APPROVED / REJECTED
isDeleted       Soft delete
createdAt       Ngày tạo
updatedAt       Ngày cập nhật
```

Quan hệ:

```txt
tracks.categoryId -> categories.id
tracks.uploaderId -> users.id
```

---

### 9.4. `comments`

Lưu bình luận của user trong track.

Công dụng:

- User comment dưới bài hát
- Hiển thị comment trong track detail
- Quản lý soft delete comment

Các field chính:

```txt
id              ID comment
content         Nội dung comment
userId          FK tới users.id
trackId         FK tới tracks.id
isDeleted       Soft delete
createdAt       Ngày tạo
updatedAt       Ngày cập nhật
```

Quan hệ:

```txt
comments.userId  -> users.id
comments.trackId -> tracks.id
```

---

### 9.5. `playlists`

Lưu playlist hoặc album.

Công dụng:

- User tạo playlist
- Admin seed playlist mặc định
- Có thể dùng làm album nếu `isAlbum = true`
- Playlist chứa nhiều track

Các field chính:

```txt
id              ID playlist
title           Tên playlist
userId          Chủ playlist
isPublic        Public/private
isAlbum         Có phải album không
isDeleted       Soft delete
createdAt       Ngày tạo
updatedAt       Ngày cập nhật
```

Quan hệ:

```txt
playlists.userId -> users.id
```

---

### 9.6. Bảng trung gian playlist - track

Tên bảng có thể tùy theo cấu hình entity, thường là dạng:

```txt
playlist_tracks
```

hoặc:

```txt
playlists_tracks
```

Công dụng:

- Lưu quan hệ nhiều-nhiều giữa playlist và track
- Một playlist có nhiều track
- Một track có thể nằm trong nhiều playlist

Các field thường có:

```txt
playlist_id     FK tới playlists.id
track_id        FK tới tracks.id
```

Quan hệ:

```txt
playlist_id -> playlists.id
track_id    -> tracks.id
```

---

### 9.7. Bảng trung gian user - liked tracks

Tên bảng có thể tùy theo cấu hình entity, thường là dạng:

```txt
user_liked_tracks
```

hoặc:

```txt
users_liked_tracks
```

Công dụng:

- Lưu track mà user đã like
- Kiểm tra user đã like track chưa
- Tăng/giảm `tracks.countLike`

Các field thường có:

```txt
user_id         FK tới users.id
track_id        FK tới tracks.id
```

Quan hệ:

```txt
user_id  -> users.id
track_id -> tracks.id
```

---

## 10. API chính

### Public Track APIs

```txt
GET    /api/v1/tracks
GET    /api/v1/tracks/find-all
GET    /api/v1/tracks/search/{id}
GET    /api/v1/tracks/{slug}
GET    /api/v1/tracks/slug/{slug}
GET    /api/v1/tracks/search?keyword=...
GET    /api/v1/tracks/top?category=ncs
POST   /api/v1/tracks/{trackId}/play
```

---

### Auth-required Track APIs

Cần Bearer Token.

```txt
POST   /api/v1/tracks
PUT    /api/v1/tracks/{id}
PATCH  /api/v1/tracks/{id}
DELETE /api/v1/tracks/{id}

GET    /api/v1/tracks/my-tracks
GET    /api/v1/tracks/liked

POST   /api/v1/tracks/{trackId}/like
POST   /api/v1/tracks/{trackId}/dislike

GET    /api/v1/tracks/{trackId}/comments
POST   /api/v1/tracks/{trackId}/comments
```

---

### Admin Track APIs

Cần role ADMIN.

```txt
GET    /api/v1/admin/tracks/find-all
GET    /api/v1/admin/tracks/search/{id}
PUT    /api/v1/admin/tracks/update/{id}
DELETE /api/v1/admin/tracks/delete/{id}
PATCH  /api/v1/admin/tracks/approve/{id}
PATCH  /api/v1/admin/tracks/reject/{id}
```

---

## 11. Bug thường gặp và cách fix

### 11.1. Lỗi không kết nối được MySQL

Lỗi thường gặp:

```txt
Access denied for user 'root'@'localhost'
```

Cách fix:

Nếu root không có password:

```properties
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
```

Nếu root có password:

```powershell
$env:DB_PASSWORD="your_password"
.\mvnw.cmd spring-boot:run
```

---

### 11.2. Lỗi Unknown database

Lỗi:

```txt
Unknown database 'soundclone'
```

Cách fix:

Tạo database:

```sql
CREATE DATABASE soundclone
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Hoặc giữ config:

```properties
createDatabaseIfNotExist=true
```

---

### 11.3. Lỗi port 8000 đã bị chiếm

Lỗi:

```txt
Port 8000 was already in use
```

Cách fix PowerShell:

```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Hoặc đổi port trong `application.properties`:

```properties
server.port=8001
```

---

### 11.4. Lỗi `setCategory(String) is undefined`

Nguyên nhân:

Đã tách `category` thành entity riêng, `Track` không còn:

```java
track.setCategory(...)
```

Cách fix:

Đổi:

```java
track.setCategory(category);
```

thành:

```java
track.setCategoryId(categoryEntity.getId());
```

Các file cần check:

```txt
TrackController.java
AdminTrackController.java
DataSeeder.java
```

Tìm nhanh:

```powershell
Get-ChildItem -Recurse .\src\main\java -Include *.java | Select-String "setCategory|getCategory|findByCategory"
```

---

### 11.5. Lỗi `Date` và `LocalDateTime` không khớp

Nguyên nhân:

`Track.java` đã đổi sang `LocalDateTime`, nhưng controller/seeder vẫn dùng:

```java
new Date()
```

Cách fix:

Với `Track`:

```java
track.setCreatedAt(LocalDateTime.now());
track.setUpdatedAt(LocalDateTime.now());
```

Không đổi `Comment`, `Playlist`, `User` nếu các entity đó vẫn dùng `Date`.

---

### 11.6. Lỗi `findByCategory... no property category found`

Nguyên nhân:

`Track` không còn field `category`.

Cách fix trong `TrackRepository`:

Đổi query cũ:

```java
findByCategoryAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(...)
```

thành:

```java
findByCategoryInfo_SlugAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(...)
```

Hoặc query theo `categoryId`:

```java
findByCategoryIdAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(...)
```

---

### 11.7. Lỗi `CategoryRepository bean not found`

Nguyên nhân:

Chưa tạo repository hoặc chưa import đúng package.

Cần có file:

```txt
src/main/java/com/example/demo/repositories/CategoryRepository.java
```

Nội dung:

```java
package com.example.demo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entities.Category;

public interface CategoryRepository extends JpaRepository<Category, String> {
    Category findBySlug(String slug);
    Category findByNameIgnoreCase(String name);
}
```

---

### 11.8. Lỗi category không seed vào DB

Check `DataSeeder.java` phải có parameter:

```java
CommandLineRunner seedData(
        UserRepository userRepository,
        TrackRepository trackRepository,
        PlaylistRepository playlistRepository,
        CategoryRepository categoryRepository)
```

Không được thiếu:

```java
CategoryRepository categoryRepository
```

---

### 11.9. Lỗi bài có chữ Đ/đ bị sai slug

Ví dụ:

```txt
ĐỪNG LÀM TRÁI TIM ANH ĐAU
```

Nếu slug bị mất chữ `Đ`, fix `slugify`:

```java
String prepared = input.trim()
        .replace("Đ", "D")
        .replace("đ", "d");
```

Sau đó mới normalize:

```java
String normalized = Normalizer.normalize(prepared, Normalizer.Form.NFD);
```

---

### 11.10. Lỗi ảnh/audio không load

Kiểm tra file có tồn tại trong:

```txt
uploads/images/
uploads/audio/
```

Kiểm tra config:

```properties
images_url=http://localhost:8000/uploads/images/
audio_url=http://localhost:8000/uploads/audio/
```

Nếu FE dùng URL khác, kiểm tra biến môi trường FE:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 12. Cách kiểm tra database sau khi chạy

Sau khi run backend, mở:

```txt
http://localhost/phpmyadmin
```

Chọn database:

```txt
soundclone
```

Kiểm tra các bảng:

```txt
users
categories
tracks
comments
playlists
playlist_tracks hoặc bảng join playlist-track
user_liked_tracks hoặc bảng join user-liked-track
```

Check category:

```sql
SELECT * FROM categories;
```

Check track có categoryId chưa:

```sql
SELECT id, title, categoryId FROM tracks;
```

Check track được duyệt:

```sql
SELECT id, title, approvalStatus FROM tracks;
```

---

## 13. Lệnh build check lỗi

Trước khi run có thể build thử:

```powershell
.\mvnw.cmd clean install -DskipTests
```

Nếu build thành công, chạy:

```powershell
.\mvnw.cmd spring-boot:run
```

---

## 14. Reset backend nhanh khi lỗi DB

Khi đổi entity lớn như `Category`, `Track`, `Playlist`, nếu database cũ bị lệch schema, có thể reset DB:

```sql
DROP DATABASE soundclone;

CREATE DATABASE soundclone
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Sau đó chạy lại backend:

```powershell
cd "BE 02"
.\mvnw.cmd spring-boot:run
```

Lưu ý: reset DB sẽ mất dữ liệu cũ.
