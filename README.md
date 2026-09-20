# Artmug Artist Page v2 — GitHub Storage Edition

아트머그 작가 페이지에 iframe으로 넣기 위한 가벼운 반응형 페이지입니다.

**v2의 가장 큰 변경점:** Cloudflare R2와 KV를 완전히 제거하고, 관리자에서 수정한 글/설정/사진/GIF를 **GitHub 저장소에 직접 저장**합니다.

- `/` : 공개 작가 페이지
- `/admin/` : 관리자 페이지
- GitHub `site-data/site.json` : 모든 문구/카테고리/설정
- GitHub `site-media/...` : PNG/JPG/WEBP/GIF
- Cloudflare Pages Functions : 관리자 로그인, GitHub 저장/읽기, 이미지 전달
- R2 불필요
- KV 불필요
- Cloudinary 불필요
- React/Vue/jQuery/외부 폰트 없음

---

## 0. 권장 구조 — 저장소 2개

가장 추천하는 방법입니다.

### A. 코드 저장소
예: `artmug-page`

이 ZIP의 파일을 올리고 Cloudflare Pages와 연결합니다.

### B. 콘텐츠 저장소
예: `artmug-content`

관리자에서 수정한 `site.json`, 사진, GIF가 자동으로 저장됩니다. **비공개(Private) 저장소도 가능합니다.**

```text
GitHub
├─ artmug-page       ← Cloudflare Pages가 배포하는 코드
└─ artmug-content    ← 관리자 데이터와 이미지/GIF 저장
    ├─ site-data/
    │   └─ site.json
    └─ site-media/
        └─ 2026-09/
            ├─ xxxxx.webp
            └─ xxxxx.gif
```

코드와 콘텐츠 저장소를 분리하면 관리자에서 사진 한 장을 올릴 때마다 Cloudflare Pages가 다시 배포되는 일을 피할 수 있습니다.

> 저장소 하나만 사용하고 싶다면 `GITHUB_REPO`에 코드 저장소 이름을 넣어도 작동합니다. 다만 관리자 저장/업로드가 GitHub commit을 만들기 때문에 Cloudflare의 Git 연동 설정에 따라 새 배포가 발생할 수 있습니다.

---

# 1. GitHub 코드 저장소 만들기

1. GitHub에서 새 저장소를 만듭니다. 예: `artmug-page`
2. 이 ZIP을 압축 해제합니다.
3. **ZIP 안쪽의 파일/폴더 전체**를 저장소 루트에 업로드합니다.
4. GitHub 저장소 첫 화면에 아래 항목들이 보여야 합니다.

```text
public/
functions/
package.json
README.md
```

---

# 2. 콘텐츠 전용 GitHub 저장소 만들기

1. GitHub에서 새 저장소를 하나 더 만듭니다.
2. 예: `artmug-content`
3. Public 또는 Private 중 원하는 것을 고릅니다. Private도 가능합니다.
4. `Add a README file`을 체크해서 빈 저장소가 아닌 상태로 만들어두면 편합니다.
5. `site-data`, `site-media` 폴더는 직접 만들 필요가 없습니다. 관리자에서 첫 저장/첫 업로드 시 자동으로 생성됩니다.

---

# 3. GitHub Fine-grained Token 만들기

관리자 페이지가 콘텐츠 저장소에 파일을 쓰기 위해 토큰이 필요합니다.

GitHub에서:

1. 우측 상단 프로필 → **Settings**
2. **Developer settings**
3. **Personal access tokens**
4. **Fine-grained tokens**
5. **Generate new token**
6. Repository access에서 **Only select repositories** 선택
7. `artmug-content` 저장소만 선택
8. Repository permissions에서 **Contents → Read and write**
9. 토큰 생성
10. 생성된 토큰을 복사해서 안전한 곳에 잠시 보관

**토큰은 GitHub 코드나 public 폴더에 절대로 적지 마세요.** Cloudflare Secret에만 등록합니다.

토큰에 만료일을 설정했다면 만료 후 관리자 저장/업로드가 멈추므로 갱신해야 합니다.

---

# 4. Cloudflare Pages 연결

Cloudflare Dashboard에서:

**Workers & Pages → Create → Pages → Import an existing Git repository**

코드 저장소 `artmug-page`를 선택합니다.

권장 설정:

```text
Production branch : main
Build command     : exit 0
Build output      : public
```

배포합니다.

---

# 5. Cloudflare Variables / Secrets 등록

Pages 프로젝트에서:

**Settings → Variables and Secrets → Add**

아래 항목을 등록합니다.

## 반드시 필요한 값

| 이름 | 종류 | 예시 | 설명 |
|---|---|---|---|
| `ADMIN_PASSWORD` | Secret 권장 | 직접 정한 비밀번호 | `/admin/` 로그인 비밀번호 |
| `ADMIN_SESSION_SECRET` | Secret | 긴 무작위 문자열 | 관리자 로그인 세션 서명용 |
| `GITHUB_TOKEN` | **Secret 필수** | github_pat_... | 위에서 만든 Fine-grained Token |
| `GITHUB_OWNER` | Variable | kizzzeee0-cmyk | 콘텐츠 저장소 소유자/사용자명 |
| `GITHUB_REPO` | Variable | artmug-content | 콘텐츠 저장소 이름 |

## 선택값 — 기본값 그대로라면 생략 가능

| 이름 | 기본값 | 설명 |
|---|---|---|
| `GITHUB_BRANCH` | `main` | 콘텐츠 저장 브랜치 |
| `GITHUB_CONTENT_PATH` | `site-data/site.json` | 문구/설정 JSON 경로 |
| `GITHUB_MEDIA_DIR` | `site-media` | 사진/GIF 저장 폴더 |

예시:

```text
ADMIN_PASSWORD       = 내가 정한 관리자 비밀번호
ADMIN_SESSION_SECRET = 아주긴랜덤문자열_로그인비밀번호와다르게
GITHUB_TOKEN         = github_pat_xxxxxxxxxxxxxxxxx
GITHUB_OWNER         = 내깃허브아이디
GITHUB_REPO          = artmug-content
GITHUB_BRANCH        = main
```

등록 후 **한 번만 새 배포 또는 Retry deployment**를 해주세요.

v2에서는 R2 Binding과 KV Binding을 만들 필요가 없습니다.

---

# 6. 관리자 페이지 첫 접속

Pages 주소가 다음과 같다고 가정합니다.

```text
https://my-artmug-page.pages.dev
```

관리자:

```text
https://my-artmug-page.pages.dev/admin/
```

`ADMIN_PASSWORD`에 설정한 비밀번호로 로그인합니다.

처음 접속했을 때 아직 콘텐츠 저장소에 `site-data/site.json`이 없으면 기본 예시 데이터가 표시됩니다.

상단에 다음과 비슷한 안내가 보일 수 있습니다.

```text
GitHub 저장소 확인 필요
site-data/site.json 파일이 아직 없습니다.
관리자에서 처음 저장하면 자동 생성됩니다.
```

정상입니다.

**전체 저장**을 한 번 누르면 콘텐츠 저장소에 자동으로:

```text
site-data/site.json
```

파일이 만들어집니다.

이후 관리자 화면에 `GitHub 저장소 연결됨`이 표시됩니다.

---

# 7. 이미지 / GIF 업로드 방식

관리자에서 `파일 업로드`를 누르면 파일이 브라우저 → Cloudflare Pages Function → GitHub API 순서로 전달됩니다.

예:

```text
site-media/2026-09/0a12b3c4-....webp
site-media/2026-09/5f67a890-....gif
```

공개 페이지에서는 실제 GitHub 토큰이나 저장소 주소를 노출하지 않고 다음과 같은 주소로 이미지를 표시합니다.

```text
/media/2026-09/0a12b3c4-....webp
```

Pages Function이 GitHub 파일을 대신 읽어 전달하므로 **Private 콘텐츠 저장소도 사용 가능합니다.**

### 업로드 제한

v2 관리자 업로드는 안정성을 위해 파일 하나당 **10MB 이하**로 제한했습니다.

권장:

- 일반 이미지: WEBP, 약 300KB~1.5MB
- 프로필: WEBP/PNG, 가능하면 1MB 이하
- GIF: 가능하면 2~6MB 이하
- 너무 큰 GIF는 프레임 수/해상도를 줄인 뒤 업로드

업로드한 파일은 UUID 이름으로 저장되어 서로 덮어쓰지 않습니다.

---

# 8. 관리자에서 가능한 작업

- 작가 프로필 사진
- 작가 이름
- 부 설명
- 사용 프로그램 / 작업 분야
- 작가 소개
- 현재 작업 일정
- 포인트 색상
- 안내 및 유의사항 추가/삭제
- 공지 세부 문구 추가/삭제
- 작업 진행 단계 추가/삭제
- 아바타 카테고리 추가/삭제
- 아바타 사진 여러 장 업로드
- 판매중인 개인작 여러 개 등록
- 얼굴 사진 + GIF 등록
- 가격/구성 내용 수정
- 포트폴리오 카테고리 추가/삭제
- Before/After 비교형
- GIF/정사각형
- 16:9
- 자유 비율 그리드
- 협업 작가 ON/OFF
- 신청 항목 추가/삭제
- 개인작 선택지 수정
- 신청 양식 Placeholder 수정

모든 텍스트 설정은 `site-data/site.json` 하나에 저장됩니다.

---

# 9. 공개 페이지 즉시 반영

공개 페이지는 정적 `default.json`만 읽는 것이 아니라 `/api/content`를 통해 GitHub의 최신 `site-data/site.json`을 읽습니다.

따라서 **콘텐츠 저장소를 코드 저장소와 분리해서 사용하면 관리자 수정 때문에 Pages를 다시 배포할 필요가 없습니다.**

내용 응답에는 짧은 캐시가 적용되고, 관리자에서 전체 저장을 누르면 해당 캐시를 삭제하도록 구성되어 있습니다.

업로드 파일은 UUID 주소를 사용하므로 장기 캐시됩니다.

---

# 10. 아트머그 iframe 적용

Cloudflare Pages 주소를 확인한 뒤 아트머그 iframe 입력란에 아래처럼 넣습니다.

```html
<iframe
  src="https://YOUR-PROJECT.pages.dev/"
  width="100%"
  height="14000"
  frameborder="0"
  scrolling="no"
  loading="lazy"
  style="display:block;width:100%;max-width:100%;border:0;background:transparent;overflow:hidden;"
></iframe>
```

`YOUR-PROJECT`만 실제 프로젝트명으로 변경하세요.

예:

```html
<iframe
  src="https://chilgong-artmug.pages.dev/"
  width="100%"
  height="14000"
  frameborder="0"
  scrolling="no"
  loading="lazy"
  style="display:block;width:100%;max-width:100%;border:0;background:transparent;overflow:hidden;"
></iframe>
```

### 높이에 관하여

아트머그와 Cloudflare Pages는 서로 다른 도메인이므로 iframe 내부 페이지가 부모 아트머그 문서의 iframe 높이를 자유롭게 변경할 수 없습니다.

아래가 잘리면:

```text
height="16000"
height="18000"
```

처럼 높이고, 빈 공간이 너무 크면 줄이세요.

---

# 11. 색상 / 다크모드

기본값:

```text
Lavender : #9389DE
Cream    : #FFFDE5
```

원래 요청의 `#ffffde5`는 HEX 자릿수가 맞지 않기 때문에 `#FFFDE5`를 기본값으로 사용합니다.

운영체제/브라우저가 다크모드이면 `prefers-color-scheme: dark`를 감지하여 자동으로 어두운 화면을 사용합니다.

---

# 12. v1에서 더 이상 필요 없는 것

v1 설명에서 만들라고 했던 아래 두 항목은 **v2에서는 필요 없습니다.**

```text
SITE_CONTENT KV Binding  ← 삭제/미사용
MEDIA R2 Binding         ← 삭제/미사용
```

Cloudflare R2를 활성화할 필요도 없습니다.

기존에 아직 R2/KV를 만들지 않았다면 그냥 무시하면 됩니다.

이미 v1에 실제 데이터를 저장한 경우 v2가 R2/KV 데이터를 자동 이전하지는 않습니다.

---

# 13. 오류 해결

## 관리자 로그인 자체가 안 됨

Cloudflare에 아래가 있는지 확인:

```text
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

등록 후 재배포합니다.

## 로그인은 되는데 `GitHub 저장소 설정이 없습니다`가 나옴

다음을 확인:

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_TOKEN
```

특히 `GITHUB_REPO`에는 URL 전체가 아니라 저장소 이름만 넣습니다.

잘못된 예:

```text
https://github.com/example/artmug-content
```

올바른 예:

```text
artmug-content
```

## 저장할 때 403 오류

Fine-grained Token의 저장소 접근 범위와 권한 확인:

```text
Repository access → artmug-content 포함
Contents → Read and write
```

토큰 만료 여부도 확인하세요.

## 저장할 때 404 오류

- `GITHUB_OWNER` 오타
- `GITHUB_REPO` 오타
- 토큰이 해당 Private 저장소에 접근할 수 없음
- `GITHUB_BRANCH`가 실제 브랜치와 다름

을 확인하세요.

## 이미지 업로드 실패

- 파일이 PNG/JPG/WEBP/GIF인지 확인
- 10MB 이하인지 확인
- GitHub Token `Contents: Read and write` 확인

## 공개 페이지에는 기본 예시만 나옴

관리자에서 **전체 저장**을 한 번 누르고 콘텐츠 저장소에 다음 파일이 실제 생성됐는지 확인합니다.

```text
site-data/site.json
```

## iframe에서 아예 페이지가 안 보임

- Pages URL이 `https://`인지 확인
- `public/_headers` 파일이 배포됐는지 확인
- 아트머그 iframe 코드의 `src` 확인

## iframe 아래가 잘림

iframe의 `height` 값을 늘립니다.

---

# 보안 메모

아래 값은 절대 GitHub 저장소에 직접 적지 마세요.

```text
GITHUB_TOKEN
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

Cloudflare **Variables and Secrets**에서 Secret으로 관리하세요.

브라우저에서 실행되는 `public/assets/*.js`에는 GitHub Token이 들어있지 않습니다. 모든 GitHub 쓰기 작업은 `/functions`의 서버 측 코드에서 처리합니다.


## v2.1 - 사진 업로드에서 404 Not Found가 뜰 때

관리자에서 `GitHub 요청 실패 (404): Not Found`가 뜨는 경우 파일 형식 문제가 아니라 **GitHub 저장소 접근 설정** 문제인 경우가 대부분입니다.

1. Cloudflare의 `GITHUB_OWNER`가 GitHub 사용자명과 정확히 같은지 확인합니다.
2. `GITHUB_REPO`가 코드 저장소가 아니라 콘텐츠 저장소(예: `artmug-content`) 이름인지 확인합니다.
3. GitHub Fine-grained token의 **Repository access → Only select repositories**에서 콘텐츠 저장소가 선택되어 있는지 확인합니다.
4. **Repository permissions → Contents → Read and write**인지 확인합니다.
5. 토큰을 다시 만들었다면 Cloudflare `GITHUB_TOKEN` 값을 새 토큰으로 교체하고 새 배포를 실행합니다.
6. `GITHUB_BRANCH`는 삭제하거나 비워두는 것을 권장합니다. v2.1부터 저장소의 실제 default branch를 자동으로 감지합니다.

관리자 로그인 후 상단의 GitHub 연결 상태가 `GitHub 저장소 연결됨`으로 표시되면 업로드 준비가 된 상태입니다.
