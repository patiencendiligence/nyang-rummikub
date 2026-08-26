# 냥루미큐브 (Nyang Rummikub)

설치나 회원가입 없이, URL 하나로 친구와 바로 시작하는 실시간 멀티플레이 루미큐브입니다.

## 만든 이유
친구들과 온라인으로 루미큐브를 하고 싶었는데 마땅한 서비스가 없어서 직접 만들었습니다.
설치 없이, 광고시청 없이 링크 하나로 바로 플레이 할 수 있는 경험에 가장 집중했습니다.

## 특징
- 회원가입/설치 없이 URL 접속만으로 방 생성·입장 가능
- Socket.IO 기반 방(room) 단위 실시간 이벤트 시스템
- Express + Vite 단일 서버 구조로 정적 리소스 서빙과 실시간 통신을 함께 처리해 배포·운영 복잡도 최소화 (Render 단일 인스턴스 배포)

## 기술 스택
| 영역 | 기술 |
|---|---|
| Frontend | TypeScript, Vite |
| Realtime | Socket.IO |
| Server | Express (`server.ts`) |


## 실행 방법
```bash
npm install
npm run dev
```
> package.json의 스크립트명이 다를 수 있으니, 실제 명령어는 저장소 기준으로 확인해주세요.

## LIVE
https://nyang-rummikub.onrender.com/


