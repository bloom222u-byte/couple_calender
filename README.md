# OurDays v1.1

Supabase 연결 버전입니다.

## v1.1 수정 내용

- `photos.storage_path` 컬럼 없이 작동하도록 수정
- 현재 photos 테이블 구조 그대로 사용 가능
  - `id`
  - `date`
  - `caption`
  - `image_url`
  - `created_at`
- 사진은 Supabase Storage `couple-photos`에 업로드되고, 공개 URL만 `photos.image_url`에 저장됩니다.
- 사진 삭제 시 DB 기록만 삭제됩니다. Storage 파일 원본 삭제는 v1.2에서 `storage_path` 컬럼 추가 후 다시 붙일 수 있습니다.

## 업로드할 파일

GitHub 저장소 루트에 아래 파일을 덮어쓰기 업로드하세요.

- `index.html`
- `style.css`
- `script.js`
- `supabase.js`
- `config.js`

## 확인할 Supabase 설정

1. `events`, `photos` 테이블이 있어야 합니다.
2. `photos` 테이블은 현재처럼 `image_url`까지만 있어도 됩니다.
3. Storage bucket 이름은 `couple-photos`여야 합니다.
4. `couple-photos` bucket은 Public이어야 합니다.
5. Storage policy에서 anon select/insert/delete가 허용되어야 합니다.
