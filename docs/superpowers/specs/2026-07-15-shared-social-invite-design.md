# Thiết kế: Luồng thiệp mời chung cho mạng xã hội (/chung-vui)

Ngày: 2026-07-15
Trạng thái: Đã được duyệt (người dùng chốt từng phần qua AskUserQuestion)

## Mục tiêu

Thêm một luồng thực thi **riêng biệt** so với luồng khách mời hiện tại
(tìm tên → thiệp riêng cá nhân), để chủ tiệc có thể đăng 1 link duy nhất lên
mạng xã hội cho toàn bộ vòng bạn bè chung — không gắn với một khách cụ thể
nào trong bảng `guests`.

Luồng mới: vào trang có bố cục giống hệt trang chủ hiện tại, nhưng thay vì
nhập tên để tìm khách, người xem nhập một mật khẩu cố định (`2307`, ứng với
ngày tổ chức 23/07) để "mở khoá" thiệp chung. Sau khi mở khoá, thấy thiệp
chung (đếm ngược/ảnh/gallery/bản đồ) như bình thường, và có nút xem "thiệp
riêng" — nhưng thiệp riêng ở đây được viết theo kiểu lời mời chung chung cho
tất cả mọi người, không phải cá nhân hoá theo tên.

## Quyết định thiết kế (đã được người dùng chốt)

1. **RSVP:** Thiệp riêng chung chung **không có nút RSVP**, không có
   `MessageModal` gửi lời nhắn. Chỉ hiển thị nội dung lời mời (thông báo một
   chiều). Ai muốn xác nhận tham dự thật sự vẫn phải dùng luồng tìm tên gốc.
2. **Route:** `/chung-vui` — một route duy nhất, không có route con thứ hai.
   Cổng mật khẩu và thiệp chung nằm trong cùng 1 page component, chuyển đổi
   bằng state nội bộ (không lưu localStorage/sessionStorage).
3. **Ghi nhớ mật khẩu:** Không ghi nhớ. Mỗi lần vào `/chung-vui` (kể cả
   refresh) đều phải nhập lại mật khẩu — hệ quả tự nhiên của việc dùng state
   nội bộ thay vì lưu trữ trình duyệt, không cần logic ẩn/hiện riêng.
4. **Định dạng mật khẩu:** Chuỗi số `"2307"` (không dấu `/`). So khớp sau khi
   chuẩn hoá (bỏ khoảng trắng thừa), không cần chấp nhận các biến thể có dấu
   phân cách khác.
5. **Nội dung thiệp riêng chung chung:** Toàn bộ nội dung thư (kể cả câu chào
   mở đầu) do chủ tiệc tự soạn sau, chỉnh sửa được ở trang Admin — không viết
   cứng "Kính mời các bạn" hay bất kỳ câu chào nào trong code.
6. **Kiến trúc code:** Tách phần nội dung thiệp chung (đếm ngược/ảnh
   bìa/gallery/địa điểm-bản đồ) hiện đang nằm trong `PublicInvite.tsx` thành
   1 component dùng lại được, để tránh copy-paste giữa luồng khách thật và
   luồng mạng xã hội, trong khi route/mật khẩu/modal vẫn tách biệt hoàn toàn.

## Kiến trúc

### Routing

```
/chung-vui  (component mới: SharedInvite.tsx)
 ├─ state = "gate"     → bố cục giống HomePage, ô nhập mật khẩu thay vì tên
 └─ state = "unlocked" → nội dung giống /thiep-chung + CTA luôn hiện
                          → mở PublicEnvelopeModal (component mới)
```

Không thêm route con. `App.tsx` thêm 1 dòng
`<Route path="/chung-vui" element={<SharedInvite />} />`. Các route hiện có
(`/`, `/thiep-chung/:guestId?`, `/thiep/:guestId`, `/admin*`) không đổi.

### Trang cổng mật khẩu (state "gate")

- Tái sử dụng `InviteFrame`, phần hero (pill "Happy"/"Graduation"/tên chủ
  tiệc), `MusicPlayerWidget` — bố cục giống hệt `HomePage.tsx`.
- Thay `NameSearchBox` bằng 1 input mật khẩu (`type="password"` hoặc `text`,
  tuỳ thẩm mỹ — quyết định lúc code) + nút xác nhận dạng submit form (không
  phải live-search như `NameSearchBox`).
- So khớp: `input.trim() === '2307'`.
- Sai mật khẩu → hiện dòng lỗi nhỏ, ví dụ "Sai mật khẩu, vui lòng thử lại."
  (cùng style với thông báo lỗi hiện có trong `NameSearchBox.tsx`).
- Đúng mật khẩu → set state sang `"unlocked"` trong cùng component.

### Tách phần dùng chung từ `PublicInvite.tsx`

- **`src/hooks/useEventInfo.ts`** (mới): trích logic fetch
  `event_settings` + `gallery_photos` hiện đang lặp lại inline trong
  `PublicInvite.tsx` (dòng ~45-66), trả về `{ settings, gallery, loading,
  error, reload }`.
- **`src/components/EventInfoSections.tsx`** (mới): trích JSX phần đếm
  ngược/ảnh bìa/gallery/địa điểm-bản đồ (dòng ~86-150 hiện tại của
  `PublicInvite.tsx`), nhận `settings: EventSettings` và
  `gallery: GalleryPhoto[]` làm props, không chứa state riêng.
- **`PublicInvite.tsx`** (luồng khách mời thật — refactor thuần, không đổi
  hành vi): dùng `useEventInfo()` + `<EventInfoSections>` thay cho JSX inline
  cũ; phần header/CTA/`EnvelopeModal` gắn với `guestId` giữ nguyên y hệt.
  Test hiện có (`PublicInvite.test.tsx`) phải tiếp tục pass không cần sửa.
- **`SharedInvite.tsx`** (trang mới, state "unlocked"): dùng lại
  `useEventInfo()` + `<EventInfoSections>`, CTA "Xem lời mời riêng dành cho
  bạn" luôn hiển thị (không phụ thuộc `guestId`), mở `PublicEnvelopeModal`.

### `PublicEnvelopeModal.tsx` (mới)

Modal riêng, **không dùng chung** với `EnvelopeModal.tsx` — để không đụng vào
animation phong bì (state machine envelope/opening/sliding/revealed) đang
chạy ổn định của luồng khách thật. Nội dung bên trong đơn giản hơn nhiều so
với bản gốc:

- Không gọi `useGuestInvite`, không fetch theo `guestId`.
- Không có tên/xưng hô người nhận, không có dòng "Gửi: ...".
- Không nút RSVP, không `MessageModal`, không màn "complete".
- Sau khi mở phong bì (tái dùng animation/CSS class `env-*` có sẵn trong
  `EnvelopeModal.css`) → hiện thiệp với tiêu đề "Thư mời lễ tốt nghiệp" + đoạn
  `event_settings.public_invite_message` (giữ nguyên xuống dòng) + nút
  "Đóng".
- Nếu `public_invite_message` rỗng/null → hiện placeholder: "Nội dung lời mời
  đang được cập nhật."

### Dữ liệu (Supabase)

- **Migration mới** `supabase/migrations/<timestamp>_add_public_invite_message.sql`:
  thêm cột `public_invite_message text` (nullable) vào bảng `event_settings`.
  Không cần policy RLS mới — bảng đã có `event_settings_public_read` cho
  phép đọc mọi cột (`using (true)`).
- **`src/types/database.ts`**: `EventSettings` thêm field
  `public_invite_message: string | null`.

### Trang Admin

- `src/pages/admin/AdminEventSettings.tsx`: thêm 1 `<textarea>` "Lời mời
  chung (đăng mạng xã hội)" vào form hiện có, lưu qua cùng nút "Lưu thông tin
  sự kiện" — thêm `public_invite_message: settings.public_invite_message`
  vào payload `update()` hiện tại.

## Xử lý lỗi / biên

- `/chung-vui` không có bảo vệ phía server — giống toàn bộ site hiện tại
  (chỉ dùng anon key + RLS public-read). Mật khẩu chỉ là một bước trải
  nghiệm phía client, không phải cơ chế bảo mật thật; ai xem source cũng
  thấy được chuỗi `"2307"`. Chấp nhận được vì mục đích là tạo trải nghiệm thú
  vị cho luồng chia sẻ công khai, không phải giấu thông tin nhạy cảm.
- `public_invite_message` rỗng → hiện placeholder, không để trang trắng nếu
  đăng lên mạng trước khi kịp soạn thư.
- Lỗi tải `event_settings`/`gallery_photos` trong `useEventInfo()` → dùng lại
  đúng pattern lỗi + nút "Thử lại" hiện có trong `PublicInvite.tsx`.

## Kiểm thử

- `SharedInvite.test.tsx` (mới): gate hiện đúng khi mật khẩu sai; chuyển sang
  state "unlocked" khi nhập đúng "2307"; CTA hiển thị và mở
  `PublicEnvelopeModal`; refresh/mount lại quay về state "gate".
- `PublicEnvelopeModal.test.tsx` (mới): hiển thị đúng
  `public_invite_message`; hiển thị placeholder khi rỗng; không có nút RSVP,
  không có tên khách.
- `useEventInfo.test.ts` (mới, hoặc gộp vào test của `PublicInvite` cũ tuỳ
  lúc code): fetch đúng `event_settings` + `gallery_photos`, xử lý lỗi.
- `PublicInvite.test.tsx` hiện có: rà lại sau khi refactor dùng
  `EventInfoSections`/`useEventInfo`, đảm bảo không đổi hành vi, không cần
  sửa assertion.
- `AdminEventSettings.test.tsx` hiện có: thêm case nhập/lưu
  `public_invite_message`.

## Ngoài phạm vi

- Không đổi luồng RSVP/`MessageModal` của khách mời thật (`EnvelopeModal.tsx`,
  `GuestInviteCard.tsx`, `useGuestInvite.ts`) — giữ nguyên hoàn toàn.
- Không thêm cơ chế bảo mật thật (server-side check, rate limit) cho mật khẩu
  `/chung-vui`.
- Không ghi nhớ trạng thái mở khoá giữa các lần vào lại (theo quyết định đã
  chốt).
- Không tự động chạy migration lên Supabase thật — sẽ xin xác nhận riêng ở
  bước thực thi (giống quy ước các spec trước).
