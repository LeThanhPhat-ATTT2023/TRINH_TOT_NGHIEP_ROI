# Thiết kế: Popup bao thư + thiệp riêng chui ra (animation)

Ngày: 2026-07-12
Trạng thái: Đã được duyệt (người dùng chốt qua Visual Companion + AskUserQuestion)

## Mục tiêu

Trên thiệp chung (`/thiep-chung/:guestId`), khi khách bấm nút "Xem lời mời riêng
dành cho bạn", thay vì điều hướng sang trang khác, hiện **popup bao thư**: khách
chạm vào bao thư, nắp mở ra và **thiệp riêng chui ra khỏi bao thư** bằng
animation, kèm nút RSVP hoạt động ngay trong popup.

## Quyết định thiết kế (đã được người dùng chốt)

1. **Vị trí trải nghiệm (phương án A):** popup tại chỗ trên thiệp chung — thiệp
   riêng và RSVP hiển thị ngay trong popup, URL không đổi, không rời trang.
2. **Cách mở:** chạm để mở — bao thư hiện ra kèm gợi ý "✨ Chạm để mở thư";
   khách bấm vào bao thư thì nắp mở và thiệp chui ra (không tự động mở).
3. **Kiểu bao thư (mockup B chỉnh sửa):** thân hồng pastel `#fbcfe8`, nếp gấp
   hông `#f9bedf`, nắp hồng đậm `#f472b6`, **dấu sáp màu kem** `#faf6e8` (viền
   kem đậm `#f0e3c0`) với **icon mũ tốt nghiệp SVG tô maroon** đồng bộ theme,
   sparkle vàng hai góc.
4. **Kỹ thuật animation:** Framer Motion — cài package `motion` (tên phát hành
   hiện tại của Framer Motion, hỗ trợ React 19), import từ `motion/react`.

## Luồng trải nghiệm

1. Nút CTA "Xem lời mời riêng dành cho bạn" đổi từ `Link` thành `button` mở
   popup (overlay tối mờ phủ toàn màn hình).
2. Popup mở: backdrop fade in, bao thư zoom nhẹ vào giữa màn hình (spring),
   dòng "✨ Chạm để mở thư" bên dưới. Đồng thời fetch dữ liệu guest.
3. Khách chạm bao thư → dấu sáp tách, nắp lật mở (`rotateX` 3D, ~0.5s) → thiệp
   trượt lên từ trong bao thư (`translateY`, ~0.7s, lúc đầu bị mép trước bao
   thư che một phần) → thiệp phóng to về giữa popup, bao thư trượt xuống + mờ
   dần → hoàn tất.
4. Thiệp trong popup là nội dung thiệp riêng đầy đủ: "Kính mời {salutation}
   {full_name}", `greeting_message`, thông tin sự kiện, `RsvpButtons`
   ("Tôi sẽ tham dự" / "Xin phép vắng mặt") gửi RSVP ngay trong popup
   (optimistic update như trang GuestInvite).
5. Đóng popup: nút X, bấm backdrop, hoặc phím Esc. Mở lại → animation chạy lại
   từ đầu. Focus trả về nút CTA khi đóng.

## Kiến trúc

### Thành phần mới

- `src/components/EnvelopeModal.tsx` + `EnvelopeModal.css`
  - Overlay (`role="dialog"`, `aria-modal="true"`) + bao thư + orchestration
    chuỗi trạng thái animation bằng `motion`/`AnimatePresence`.
  - Props: `guestId: string`, `eventSettings: EventSettings` (thiệp chung đã
    fetch sẵn), `onClose: () => void`.
  - Bao thư là `<button>` có `aria-label="Chạm để mở thư"`; focus được đưa vào
    bao thư khi popup mở.
  - Trạng thái: `envelope` (chờ chạm) → `opening` (nắp mở) → `card-out`
    (thiệp trượt lên) → `revealed` (thiệp giữa màn hình, cuộn được,
    max-height 85dvh).
- `src/components/GuestInviteCard.tsx` (tách từ `GuestInvite.tsx`)
  - Toàn bộ tấm thiệp riêng, **bao gồm khung `InviteFrame`** (tấm lót sọc +
    viền lượn sóng): lời chào, lời nhắn, thông tin sự kiện, RsvpButtons, thông
    báo lỗi RSVP — để thiệp chui ra trong popup trông y hệt thiệp riêng.
  - Presentational — nhận `guest`, `eventSettings`, `submitting`, `rsvpError`,
    `onRespond` qua props.
  - Dùng chung cho trang `GuestInvite` và `EnvelopeModal` (không duplicate).
- `src/hooks/useGuestInvite.ts` (tách từ `GuestInvite.tsx`)
  - Gom fetch guest theo id + gửi RSVP qua RPC `submit_rsvp` với optimistic
    update/rollback. Trả về `{ guest, loading, notFound, submitting,
    rsvpError, respond }`.
  - Trang `GuestInvite` và `EnvelopeModal` cùng dùng hook này.

### Thay đổi thành phần hiện có

- `src/pages/PublicInvite.tsx`: CTA đổi thành `button` + state mở
  `EnvelopeModal`; truyền `guestId` và `settings` vào modal.
- `src/pages/GuestInvite.tsx`: refactor dùng `useGuestInvite` +
  `GuestInviteCard`, giao diện và hành vi giữ nguyên. Trang vẫn tự fetch
  `event_settings` như hiện tại (hook chỉ phụ trách guest + RSVP; popup thì
  nhận settings có sẵn từ PublicInvite).
- `package.json`: thêm dependency `motion`.

### Route

- `/thiep/:guestId` (GuestInvite) **giữ nguyên** làm đường vào cho khách nhận
  link riêng trực tiếp; không có animation ở đó (ngoài phạm vi).

## Xử lý lỗi / biên

- Fetch guest chạy ngay khi popup mở (song song lúc khách nhìn bao thư).
- Guest không tồn tại / lỗi mạng: popup thay bao thư bằng thông báo "Không tìm
  thấy thiệp mời này." / "Không tải được, vui lòng thử lại." + nút thử lại,
  vẫn đóng được bình thường.
- Nếu khách chạm bao thư khi data chưa về: nắp vẫn mở, thiệp hiện khung với
  "Đang tải..." rồi đổ nội dung khi data về (không chặn thao tác chạm).
- RSVP lỗi: giữ nguyên hành vi optimistic rollback + thông báo lỗi như trang
  GuestInvite (logic nằm trong hook dùng chung).
- `prefers-reduced-motion`: dùng `useReducedMotion` của motion — bỏ qua chuỗi
  animation, backdrop hiện tĩnh và thiệp hiển thị ngay ở trạng thái
  `revealed`.
- Mobile: bao thư rộng ~90vw (max 340px); thiệp co theo viewport, cuộn dọc khi
  nội dung dài.

## Kiểm thử

- `EnvelopeModal.test.tsx` (mới): (a) bấm CTA → popup + bao thư hiện; (b) chạm
  bao thư → hiện đúng tên khách + lời nhắn; (c) bấm RSVP trong popup → gọi RPC
  `submit_rsvp`, cập nhật trạng thái; (d) guest không tồn tại → thông báo lỗi;
  (e) Esc/X/backdrop đóng popup. Mock Supabase như các test hiện có; tắt
  animation trong test bằng `MotionGlobalConfig.skipAnimations = true`.
- `PublicInvite.test.tsx` (cập nhật): CTA là button mở popup thay vì Link điều
  hướng; không còn kỳ vọng `href="/thiep/:id"`.
- `GuestInvite.test.tsx`: giữ nguyên kỳ vọng hiện có (trang không đổi hành vi
  sau refactor sang hook + card dùng chung).

## Ngoài phạm vi

- Không đổi giao diện/logic trang GuestInvite (ngoài refactor tách code), admin,
  schema Supabase.
- Không thêm animation bao thư cho luồng link trực tiếp `/thiep/:guestId`.
- Không thêm nhạc/âm thanh khi mở thư.
