# v2.1 변경사항

- PC 상단 작가 소개 문구가 120px 프로필 사진 열에 잘못 배치되어 여러 줄로 쪼개지던 레이아웃 버그 수정
- 작가 설명을 이름/부 설명/프로그램과 같은 넓은 콘텐츠 열 안에 배치
- GitHub 업로드 404 오류 진단 강화
- GITHUB_BRANCH를 비워두면 GitHub 저장소의 실제 기본 브랜치를 자동 감지
- 관리자 로그인 후 GitHub 토큰 사용자/저장소/브랜치 연결 상태를 자동 검사
- 잘못된 토큰, 저장소명, 저장소 접근권한, Contents 쓰기권한 오류를 더 구체적으로 표시
- R2/KV는 계속 사용하지 않음

# Changelog

## v2.0.0 — GitHub Storage Edition

- Cloudflare R2 제거
- Cloudflare KV 제거
- GitHub Contents API 기반 콘텐츠 저장 추가
- GitHub Contents API 기반 PNG/JPG/WEBP/GIF 업로드 추가
- Private 콘텐츠 저장소 지원
- 코드 저장소와 콘텐츠 저장소 분리 지원
- 관리자 상단 GitHub 저장소 연결 상태 표시
- GitHub API 오류 상세 표시 개선
- 공개 페이지 콘텐츠를 GitHub `site-data/site.json`에서 동적으로 읽도록 변경
- `/media/*`를 통해 GitHub 미디어를 프록시하고 장기 캐시하도록 변경
- 콘텐츠 응답 짧은 캐시 + 관리자 저장 시 캐시 무효화
- Fine-grained Token 권한 최소화 안내 추가
- 초보용 `SETUP-CHECKLIST.md` 추가
- `.env`, `.dev.vars` Git 커밋 방지 강화
