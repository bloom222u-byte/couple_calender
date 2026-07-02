# OurDays

커플 일정과 사진을 함께 관리하는 모바일 우선 데이트 캘린더입니다.

## 파일 구조

- `index.html` 화면 구조
- `style.css` 디자인
- `script.js` 앱 로직
- `supabase.js` Supabase 연결/저장/삭제
- `config.js` Supabase URL, Publishable Key, Storage bucket 이름

## GitHub Pages에 올리는 법

1. 이 압축 파일을 풉니다.
2. GitHub 저장소에 있는 기존 파일을 삭제하거나 덮어씁니다.
3. 아래 파일 5개를 저장소 루트에 업로드합니다.
   - `index.html`
   - `style.css`
   - `script.js`
   - `supabase.js`
   - `config.js`
4. Commit changes를 누릅니다.
5. 1~2분 뒤 GitHub Pages 주소를 새로고침합니다.

## Supabase에서 꼭 확인할 것

1. `events`, `photos` 테이블이 있어야 합니다.
2. Storage bucket 이름은 `couple-photos`여야 합니다.
3. `couple-photos` bucket은 Public이어야 합니다.
4. 테이블 RLS policy가 anon select/insert/delete를 허용해야 합니다.

## 주의

현재 버전은 로그인 없이 URL을 아는 사람이 입력/삭제할 수 있습니다.
남친과 테스트용으로는 괜찮지만, 나중에는 커플 초대코드나 로그인 기능을 붙이는 것을 추천합니다.
