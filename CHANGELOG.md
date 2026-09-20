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
