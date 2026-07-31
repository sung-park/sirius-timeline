# Sirius Timeline Lab

펫 트래커 앱의 하루 타임라인을 웹에서 재현·개선하기 위한 실험 프로젝트입니다.

## Live demo

**https://sung-park.github.io/sirius-timeline/**

## Data

- `data/timeline-2026-07-27.json` — 카톡 스크린샷에서 추출한 하루치 raw 이벤트 (102개)

## Views

| View | 설명 |
|------|------|
| **Default** | 앱 as-is. 필터 칩 없음. 최신순 카드 리스트 (겹침 미병합) |
| **Improved** | 필터 칩 · 새벽/아침/점심/저녁/밤 섹션 · 24h 스트립 · 하이라이트 · 라벨 요약 |

## Run (local)

브라우저 CORS 때문에 `file://` 대신 로컬 서버로 엽니다.

```bash
cd /home/sung/projects/sirius-timeline
python3 -m http.server 5173
```

이후 http://localhost:5173 접속.
