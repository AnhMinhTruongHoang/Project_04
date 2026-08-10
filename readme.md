# SoundClone

> A full-stack music streaming, creator, membership, ticketing, and artist monetization platform.

**Project:** Project 04 — SoundClone  
**Platforms:** Web, Backend API, Mobile  
**Last updated:** August 10, 2026

---

## Project Overview

SoundClone is a full-stack music platform that combines music streaming, artist publishing, social interaction, creator subscriptions, paid memberships, ticketed events, QR ticket verification, notifications, artist revenue tracking, and mobile access in one system.

The project goes beyond a basic music player. It models the complete relationship between listeners, artists, administrators, and payment-backed creator features.

Listeners can discover music, follow artists, like and comment on tracks, create playlists, maintain listening history, purchase memberships, access members-only content, buy event tickets, and keep those tickets in a personal Ticket Collection.

Artists can upload and manage tracks, use Artist Studio, access subscription-based creator tools, create membership plans, publish exclusive community content, create ticketed events, and receive revenue through wallet and payout flows.

Administrators manage users, tracks, licenses, badges, events, earning rates, payouts, payments, and moderation.

### Demo — Project Overview

> **IMAGE PLACEHOLDER** — Insert a SoundClone home page or complete system overview screenshot here.

<!-- DEMO IMAGE: PROJECT OVERVIEW -->

---

## Core Goals

1. Provide a modern music streaming experience.
2. Allow artists to upload, publish, and manage original music.
3. Support creator monetization through subscriptions, memberships, events, and payouts.
4. Use real backend business logic for payment-backed features instead of frontend-only simulations.
5. Enforce ownership, roles, and permissions on the backend.
6. Support both web and mobile clients through one REST API.
7. Keep transactional workflows safe and auditable.

---

## System Architecture

```text
Next.js Web ─────────────┐
                        │ REST API / JWT
Flutter Mobile ─────────┼────> Spring Boot API
                        │          │
                        │          ├── JPA / Hibernate
                        │          ├── MySQL-compatible DB
                        │          ├── VNPay
                        │          └── Media storage
```

Both Web and Mobile use the same Spring Boot API. Important business rules are enforced by the backend rather than trusted to frontend state.

---

## Technology Stack

| Layer              | Technologies                                 |
| ------------------ | -------------------------------------------- |
| Web Frontend       | Next.js 14 App Router, React, TypeScript     |
| UI                 | Material UI (MUI)                            |
| Web Authentication | NextAuth + backend JWT                       |
| Audio              | HTML audio, WaveSurfer, shared Track Context |
| Backend            | Spring Boot 3, Java, Jakarta                 |
| Persistence        | JPA / Hibernate                              |
| Database           | MySQL-compatible relational database         |
| Mobile             | Flutter, Dart                                |
| Mobile HTTP        | Dio                                          |
| Payments           | VNPay + development test mode                |
| API Testing        | Postman                                      |
| Build Tools        | Maven, npm, Flutter CLI                      |
| Version Control    | Git / GitHub                                 |

---

# Main Features

## 1. Authentication and User Accounts

SoundClone supports:

- Registration
- Login
- JWT access and refresh tokens
- Logout
- Registration OTP verification
- OTP resend
- Forgot password
- Reset password
- Social-login backend endpoint
- Current-account retrieval
- Profile management
- Role and account-status checks
- Automatic mobile token refresh through Dio interceptors

### Demo — Authentication

> **IMAGE PLACEHOLDER** — Insert Login, Register, OTP, or Mobile Login screenshots here.

<!-- DEMO IMAGE: AUTHENTICATION -->

---

## 2. Music Upload and Track Management

Artist track workflows include:

- Multipart audio upload
- Cover image upload
- Track metadata
- Categories
- Album creation
- SHA-256 duplicate-audio detection
- Processing status
- Approval status
- Track visibility
- Track update/delete
- Play counting
- Copyright and license information
- License document upload
- Admin Verify / Reject workflow

### Demo — Track Upload

> **IMAGE PLACEHOLDER** — Insert the track upload form here.

<!-- DEMO IMAGE: TRACK UPLOAD -->

### Demo — Track Management

> **IMAGE PLACEHOLDER** — Insert Artist track management or Admin moderation here.

<!-- DEMO IMAGE: TRACK MANAGEMENT -->

---

## 3. Music Player and Listening Experience

The playback experience includes:

- Persistent footer player
- Shared track state
- Play / pause
- Seek
- Volume and mute controls
- Track artwork and metadata
- Waveform-based playback
- Listening history
- Play-count tracking
- Recommended tracks
- Top tracks
- Category discovery
- Hidden Gems
- NCS playlist slider

### Demo — Music Player

> **IMAGE PLACEHOLDER** — Insert the global footer player here.

<!-- DEMO IMAGE: MUSIC PLAYER -->

### Demo — Track Waveform

> **IMAGE PLACEHOLDER** — Insert the track detail page and waveform here.

<!-- DEMO IMAGE: TRACK WAVEFORM -->

---

## 4. Profiles and Social Features

Profiles support:

- Profile image and cover image
- Artist/user information
- Follow / unfollow
- Followers and following
- Profile badges
- Popular tracks
- Playlists
- Listening history
- Artist leaderboard
- Concerts / Tour
- Membership
- Ticket Collection
- Owner-only controls

### Demo — Artist Profile

> **IMAGE PLACEHOLDER** — Insert a complete Artist Profile screenshot here.

<!-- DEMO IMAGE: ARTIST PROFILE -->

---

## 5. Playlists and Library

Users can:

- Create playlists
- Update playlists
- Delete playlists
- View playlists
- Manage personal playlists
- View liked tracks
- View listening history
- Navigate personal library content

### Demo — Playlist / Library

> **IMAGE PLACEHOLDER** — Insert a playlist or Library page screenshot here.

<!-- DEMO IMAGE: PLAYLIST LIBRARY -->

---

## 6. Artist Studio

Artist Studio provides creator tools such as:

- Plays, likes, comments, and fan statistics
- Track-management workspace
- Upload quota
- Subscription information
- Artist benefits
- Advanced insights
- Monetization permission
- Distribution permission
- Scheduled-release permission
- Membership permission
- Ticketing permission

Permissions are derived from the active backend subscription plan.

### Demo — Artist Studio

> **IMAGE PLACEHOLDER** — Insert the Artist Studio dashboard here.

<!-- DEMO IMAGE: ARTIST STUDIO -->

---

## 7. Subscription Plans

Current creator plans include:

| Plan            | Description                           |
| --------------- | ------------------------------------- |
| BASIC           | Free/default plan                     |
| ARTIST          | Paid creator plan                     |
| ARTIST_PRO      | Premium creator plan                  |
| ARTIST_PRO_DEMO | Free 7-day Artist Pro-equivalent demo |

Artist Pro can provide premium capabilities such as unlimited uploads, advanced insights, distribution, scheduled releases, monetization, membership benefits, and ticketing benefits.

### Artist Pro Demo

`ARTIST_PRO_DEMO` is intended for demonstration and testing. It activates directly without VNPay, provides Artist Pro-equivalent permissions, lasts 7 days, and expires through backend subscription logic.

Paid ARTIST and ARTIST_PRO plans continue to use the real payment flow.

### Demo — Subscription Plans

> **IMAGE PLACEHOLDER** — Insert Artist, Artist Pro, and Artist Pro Demo cards here.

<!-- DEMO IMAGE: SUBSCRIPTION PLANS -->

### Demo — Active 7-Day Demo

> **IMAGE PLACEHOLDER** — Insert the active Artist Pro Demo state here.

<!-- DEMO IMAGE: ARTIST PRO DEMO -->

---

## 8. Artist Memberships and Community

Eligible artists can create fan memberships and publish exclusive community content.

Artists can:

- Create membership plans
- Configure prices and member badges
- Publish text posts
- Publish image posts
- Create polls
- Share track previews
- Restrict content to members
- Restrict content to a specific membership plan
- Enable or disable comments

Listeners can:

- View artist membership plans
- Purchase membership
- Receive active membership access
- View members-only content
- Vote in polls
- Listen to exclusive track previews
- Comment when allowed

### Membership Track Preview

Artists can choose one of their tracks and define a preview start time, preview duration, caption, visibility, required membership tier, and comment availability.

### Demo — Membership Plans

> **IMAGE PLACEHOLDER** — Insert the artist membership plan dialog here.

<!-- DEMO IMAGE: MEMBERSHIP PLANS -->

### Demo — Community Feed

> **IMAGE PLACEHOLDER** — Insert the Membership / Community feed here.

<!-- DEMO IMAGE: MEMBERSHIP COMMUNITY -->

### Demo — Poll

> **IMAGE PLACEHOLDER** — Insert a membership poll here.

<!-- DEMO IMAGE: MEMBERSHIP POLL -->

### Demo — Track Preview

> **IMAGE PLACEHOLDER** — Insert the Track Preview creation/playback UI here.

<!-- DEMO IMAGE: MEMBERSHIP TRACK PREVIEW -->

---

## 9. Ticketed Events and QR Check-in

Artist Pro creators can create ticketed events containing event information, venue, date/time, ticket price, quantity, and artwork.

Events require Admin approval before public sale.

```text
Artist creates event
        ↓
Admin approves / rejects
        ↓
Approved event becomes public
        ↓
Buyer creates ticket payment
        ↓
Inventory reservation
        ↓
Payment confirmation
        ↓
Ticket fulfillment
        ↓
Unique ticket code + QR
        ↓
Ticket Collection
        ↓
QR check-in
```

The backend tracks total, sold, and reserved inventory to reduce overselling risk.

After successful payment, the system creates unique tickets, QR verification data, ticket revenue, and artist wallet entries.

Authorized staff can scan a ticket QR. The first valid scan marks the ticket as used; a second scan is rejected.

### Demo — Concerts / Tour

> **IMAGE PLACEHOLDER** — Insert the public Concerts / Tour tab here.

<!-- DEMO IMAGE: CONCERTS -->

### Demo — Create Ticketed Event

> **IMAGE PLACEHOLDER** — Insert the artist event creation dialog here.

<!-- DEMO IMAGE: CREATE EVENT -->

### Demo — Admin Event Approval

> **IMAGE PLACEHOLDER** — Insert the Admin event moderation screen here.

<!-- DEMO IMAGE: ADMIN EVENT -->

### Demo — Ticket Collection

> **IMAGE PLACEHOLDER** — Insert the buyer Ticket Collection here.

<!-- DEMO IMAGE: TICKET COLLECTION -->

### Demo — QR Ticket

> **IMAGE PLACEHOLDER** — Insert a generated ticket QR here.

<!-- DEMO IMAGE: TICKET QR -->

### Demo — Mobile QR Check-in

> **IMAGE PLACEHOLDER** — Insert the mobile camera QR scanner here.

<!-- DEMO IMAGE: MOBILE QR CHECKIN -->

---

## 10. Payments

SoundClone uses VNPay for payment-backed flows.

Order-code prefixes separate payment domains:

```text
SC...   → Account subscription
SCM...  → Artist membership
SCT...  → Event ticket
```

The backend routes VNPay IPN, return processing, and payment-status lookup according to the order code.

### VNPay

The backend validates signatures, merchant information, order identity, payment amount, transaction state, and duplicate provider transaction IDs.

A frontend redirect is not considered proof of payment.

### Development Test Payment

A development-only Test Payment option exists for times when the VNPay sandbox is unavailable.

Supported codes include:

```text
SC_TEST_SUCCESS_123456
SC_TEST_FAILED_123456
SC_TEST_CANCEL_123456
SC_TEST_EXPIRED_123456
```

Test mode still runs real backend business logic. For example, a successful ticket Test Payment still uses a real order, real reservation, real fulfillment, real tickets, a real revenue ledger, and real artist-wallet updates.

Test payment mode must be disabled in production.

### Demo — VNPay

> **IMAGE PLACEHOLDER** — Insert a VNPay sandbox payment screenshot here.

<!-- DEMO IMAGE: VNPAY -->

### Demo — Test Payment

> **IMAGE PLACEHOLDER** — Insert Test Purchase / Test Payment UI here.

<!-- DEMO IMAGE: TEST PAYMENT -->

---

## 11. Notifications

Notification functionality includes:

- Notification bell
- Unread count
- Notification popover
- Full Notifications page
- Mark one as read
- Mark all as read
- Delete notification
- Clear read notifications
- Redirect URLs
- Deduplication

Notification events can be connected to comments, follows, likes, moderation, subscriptions, memberships, payments, and ticket flows.

### Demo — Notifications

> **IMAGE PLACEHOLDER** — Insert the notification bell/popover or Notifications page here.

<!-- DEMO IMAGE: NOTIFICATIONS -->

---

## 12. Badges

SoundClone supports recognition badges such as:

- Verified Artist
- Founding Artist
- Early Supporter
- Top Listener

Badges can include a name, description, category, color, active state, award record, and optional Admin note.

### Demo — Badges

> **IMAGE PLACEHOLDER** — Insert badges on a profile or the Admin badge screen here.

<!-- DEMO IMAGE: BADGES -->

---

## 13. Artist Wallet, Revenue, and Payouts

Financial functionality can include:

- Membership revenue
- Ticket revenue
- Platform fees
- Artist net revenue
- Pending balance
- Available balance
- Revenue ledgers
- Payout requests
- Payout administration
- Payout charts

Critical financial operations are handled inside backend transaction flows.

### Demo — Artist Wallet / Earnings

> **IMAGE PLACEHOLDER** — Insert Artist Wallet or Earnings here.

<!-- DEMO IMAGE: ARTIST WALLET -->

### Demo — Admin Payouts

> **IMAGE PLACEHOLDER** — Insert the Admin payout table/chart here.

<!-- DEMO IMAGE: ADMIN PAYOUTS -->

---

## 14. Admin Dashboard

Admin functionality includes:

- User management
- Track moderation
- Copyright/license review
- Badge management
- Ticket-event approval/rejection
- Membership-related administration
- Subscription and earning-rate management
- Wallet/payout oversight
- Payment inspection
- Category management
- Comment moderation

Admin actions are protected by backend authorization, not only hidden frontend controls.

### Demo — Admin Dashboard

> **IMAGE PLACEHOLDER** — Insert the Admin dashboard overview here.

<!-- DEMO IMAGE: ADMIN DASHBOARD -->

### Demo — License Moderation

> **IMAGE PLACEHOLDER** — Insert the Verify / Reject license workflow here.

<!-- DEMO IMAGE: LICENSE MODERATION -->

---

## 15. Flutter Mobile Application

SoundClone also includes a Flutter mobile client using the same Spring Boot REST API as the web app.

Mobile architecture includes:

- Flutter / Dart
- Dio
- JWT token storage
- Automatic Bearer token injection
- Shared refresh-token request handling
- Automatic request retry after token refresh
- Mobile API service layer
- Android Emulator development support

For Android Emulator development, the Windows host backend is accessed through:

```text
http://10.0.2.2:8000
```

### Demo — Mobile Application

> **IMAGE PLACEHOLDER** — Insert the main SoundClone mobile screen here.

<!-- DEMO IMAGE: MOBILE APP -->

### Demo — Mobile Ticket Scanner

> **IMAGE PLACEHOLDER** — Insert the mobile QR scanner here.

<!-- DEMO IMAGE: MOBILE TICKET SCANNER -->

---

# Roles and Permissions

## Listener / User

Users can stream tracks, like, comment, follow, create playlists, maintain listening history, purchase memberships, access member content, purchase tickets, and view Ticket Collection.

## Artist

Artists can additionally upload music, manage tracks, use Artist Studio, access subscription-based creator tools, create memberships, publish community content, create eligible ticketed events, and receive creator revenue.

## Administrator

Admins can manage users, moderate tracks and licenses, approve ticket events, manage badges, configure earning-related settings, review payouts, and perform platform moderation.

---

# Important Business Flows

## Track Publishing

```text
Upload
→ duplicate/hash validation
→ processing
→ copyright/license data
→ Admin review
→ approved
→ public track
```

## Artist Subscription

```text
Select ARTIST / ARTIST_PRO
→ create payment
→ VNPay
→ backend verification
→ activate subscription
→ creator permissions enabled
```

## Artist Pro Demo

```text
Select ARTIST_PRO_DEMO
→ direct backend activation
→ ACTIVE
→ 7-day period
→ Artist Pro-equivalent permissions
→ EXPIRED
```

## Membership Purchase

```text
Choose membership plan
→ create SCM order
→ VNPay or DEV Test Purchase
→ backend confirmation
→ membership activation
→ members-only access
```

## Ticket Purchase

```text
Choose quantity
→ reserve inventory
→ create SCT order
→ VNPay or DEV Test Payment
→ PAID
→ fulfill ticket
→ Ticket Collection
→ QR check-in
```

---

# Project Structure

```text
Project_04/
├── BE/
│   └── src/main/java/com/example/demo/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── entities/
│       ├── dtos/
│       ├── responses/
│       ├── configs/
│       └── helpers/
│
├── FE/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── utils/
│       │   └── api.ts
│       └── types/
│
└── Mobile/
    └── lib/
        ├── config/
        ├── services/
        ├── storage/
        ├── screens/
        └── widgets/
```

---

# Local Development

## Requirements

- Java 17+
- Node.js
- npm
- Flutter SDK
- Android Studio / Android Emulator
- MySQL-compatible database
- Git
- Postman

## Run Backend

```powershell
cd BE
.\mvnw.cmd spring-boot:run
```

Default backend:

```text
http://localhost:8000
```

Compile:

```powershell
.\mvnw.cmd clean compile
```

## Run Web

```powershell
cd FE
npm install
npm run dev
```

Default web URL:

```text
http://localhost:3000
```

Before merge/deployment:

```powershell
npm run lint
npm run build
```

## Run Mobile

```powershell
cd Mobile
flutter pub get
flutter emulators
flutter emulators --launch Pixel_7
flutter devices
```

Then:

```powershell
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:8000 --dart-define=PAYMENT_TEST_MODE=true
```

---

# Environment Configuration

## Web Example

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
NEXT_PUBLIC_ARTIST_PAYOUT_MINIMUM_AMOUNT=20
NEXT_PUBLIC_PAYMENT_TEST_MODE=true
```

## Backend

Keep database passwords, JWT secrets, VNPay merchant information, VNPay hash secrets, OAuth secrets, and production credentials outside public source control.

Development-only test mode:

```properties
soundclone.payment.test-mode=true
```

Production:

```properties
soundclone.payment.test-mode=false
```

## Flutter

A recommended config pattern is:

```dart
class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static const String apiV1 = '$baseUrl/api/v1';

  static const bool paymentTestMode = bool.fromEnvironment(
    'PAYMENT_TEST_MODE',
    defaultValue: true,
  );
}
```

Never place backend secrets inside the Flutter application.

---

# Testing

## Backend Checklist

Test successful requests, validation errors, `401`, `403`, `404`, duplicate operations, ownership, role restrictions, payment idempotency, expiration, inventory release, and QR reuse prevention.

## Frontend Checklist

Test loading, empty, error, success, session states, mobile layout, desktop layout, dark-mode contrast, rapid clicks, request duplication, and permission-based controls.

## Membership End-to-End

```text
Artist creates membership plan
→ listener purchases
→ membership ACTIVE
→ members-only content available
→ non-member restricted
→ track preview obeys start/duration
→ expired membership loses access
```

## Ticket End-to-End

```text
Artist Pro creates event
→ Admin approves
→ buyer purchases
→ payment PAID
→ ticket generated
→ Ticket Collection displays ticket
→ QR loads
→ first scan succeeds
→ second scan rejected
```

Also test failed, canceled, and expired payments, reservation release, unauthorized scanner access, and oversell prevention.

---

# API Design

The Web centralizes REST calls through:

```text
FE/src/utils/api.ts
```

The Flutter application uses a corresponding Dio-based service layer.

Representative endpoint groups include:

```text
/api/v1/auth
/api/v1/users
/api/v1/tracks
/api/v1/playlists
/api/v1/categories
/api/v1/notifications
/api/v1/subscriptions
/api/v1/payments
/api/v1/artist-studio
/api/v1/artist
/api/v1/admin
/api/v1/ticket-payments
```

A common API response shape is:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

---

# Security and Reliability

SoundClone follows these principles:

- Protected routes require JWT authentication.
- Backend authorization validates ownership and roles.
- Membership and subscription access are checked server-side.
- Payment redirects are not trusted as proof of payment.
- Multi-step payment, ticket, wallet, and membership operations use transactions.
- Payment callbacks and fulfillment are designed to avoid duplicate processing.
- Used tickets cannot be checked in twice.
- Secrets must never be committed to Git.

Never commit:

- JWT secrets
- VNPay hash secrets
- Database passwords
- Refresh tokens
- OTP values
- OAuth client secrets
- Production credentials

---

# Development Status

SoundClone has evolved beyond a basic music-clone prototype into a multi-domain full-stack system.

Substantially implemented or integrated areas include:

- Authentication
- Profiles
- Track upload and management
- Music playback
- Listening history
- Likes, comments, follows
- Playlists
- Artist Studio
- Subscription plans
- Artist Pro benefits
- Artist Pro Demo
- Artist memberships
- Community posts, polls, track previews
- VNPay integration
- Development Test Payment
- Ticketed events
- Event moderation
- Ticket purchase
- Ticket Collection
- QR generation and check-in
- Notifications
- Badges
- Artist wallet/revenue foundations
- Payout administration
- Flutter API/mobile development

Current engineering priority should focus on stabilization, regression testing, responsive behavior, payment failure cases, permission testing, performance, security review, deployment, and documentation.

---

# Demo Gallery

Use this section as a final visual showcase after screenshots are ready.

## Web

> **IMAGE PLACEHOLDER — HOME PAGE**

<!-- DEMO GALLERY IMAGE: HOME -->

> **IMAGE PLACEHOLDER — TRACK PAGE**

<!-- DEMO GALLERY IMAGE: TRACK -->

> **IMAGE PLACEHOLDER — ARTIST PROFILE**

<!-- DEMO GALLERY IMAGE: PROFILE -->

> **IMAGE PLACEHOLDER — ARTIST STUDIO**

<!-- DEMO GALLERY IMAGE: ARTIST STUDIO -->

> **IMAGE PLACEHOLDER — MEMBERSHIP COMMUNITY**

<!-- DEMO GALLERY IMAGE: MEMBERSHIP -->

> **IMAGE PLACEHOLDER — TICKET COLLECTION**

<!-- DEMO GALLERY IMAGE: TICKETS -->

> **IMAGE PLACEHOLDER — ADMIN DASHBOARD**

<!-- DEMO GALLERY IMAGE: ADMIN -->

## Mobile

> **IMAGE PLACEHOLDER — MOBILE HOME**

<!-- DEMO GALLERY IMAGE: MOBILE HOME -->

> **IMAGE PLACEHOLDER — MOBILE PLAYER**

<!-- DEMO GALLERY IMAGE: MOBILE PLAYER -->

> **IMAGE PLACEHOLDER — QR SCANNER**

<!-- DEMO GALLERY IMAGE: MOBILE QR -->

---

# Future Improvements

Potential next steps include production deployment hardening, automated test coverage, structured logging, payment reconciliation, refunds, recommendation improvements, additional mobile screens, better media CDN strategy, queue-based audio processing, event analytics, membership renewal flows, creator revenue reporting, and accessibility review.

---

# Disclaimer

SoundClone is an educational/software-development project inspired by features found in modern music platforms. It is not affiliated with, endorsed by, or operated by SoundCloud.

All third-party names, payment providers, libraries, and trademarks belong to their respective owners.

---

# Summary

SoundClone demonstrates a multi-client, full-stack music ecosystem rather than only a streaming interface.

```text
Music
+ Artists
+ Listeners
+ Social interaction
+ Creator subscriptions
+ Fan memberships
+ Community content
+ Ticketed events
+ Payments
+ QR verification
+ Revenue
+ Administration
+ Mobile access
```

All major clients are connected through a shared Spring Boot API and relational data model.
