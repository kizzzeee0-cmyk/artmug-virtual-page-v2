# 초보용 설치 체크리스트

아래 항목만 차례대로 체크하면 됩니다.

- [ ] GitHub에 코드 저장소 `artmug-page` 생성
- [ ] v2 ZIP 내부 파일을 코드 저장소에 업로드
- [ ] GitHub에 콘텐츠 저장소 `artmug-content` 생성
- [ ] Fine-grained Token 생성
- [ ] Token 권한 `Contents: Read and write`
- [ ] Token 접근 저장소에 `artmug-content` 지정
- [ ] Cloudflare Pages를 `artmug-page`와 연결
- [ ] Build command `exit 0`
- [ ] Build output directory `public`
- [ ] `ADMIN_PASSWORD` 등록
- [ ] `ADMIN_SESSION_SECRET` 등록
- [ ] `GITHUB_TOKEN`을 Secret으로 등록
- [ ] `GITHUB_OWNER` 등록
- [ ] `GITHUB_REPO=artmug-content` 등록
- [ ] Cloudflare Pages Retry deployment 1회
- [ ] `https://내주소.pages.dev/admin/` 접속
- [ ] 로그인
- [ ] `전체 저장` 1회
- [ ] GitHub `artmug-content/site-data/site.json` 생성 확인
- [ ] 관리자에서 테스트 이미지 1장 업로드
- [ ] GitHub `site-media/YYYY-MM/...` 생성 확인
- [ ] 공개 페이지에서 이미지 확인
- [ ] 아트머그 iframe에 Pages 주소 입력

## Cloudflare에서 만들 필요 없는 것

- [x] R2 Bucket 필요 없음
- [x] KV Namespace 필요 없음
- [x] R2 `MEDIA` Binding 필요 없음
- [x] KV `SITE_CONTENT` Binding 필요 없음
