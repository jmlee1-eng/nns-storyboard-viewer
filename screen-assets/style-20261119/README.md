# 2026-11-19 화풍·구조 수정본

현재 뷰어가 사용하는 교체 이미지입니다. 이전 `revision-20261119` 시안은 이력을 위해 보존합니다. 모브·가시·방벽은 냥냥시노비 캐릭터/기존 FX013 원화를 직접 참조했습니다.

- 축음기: 낡은 목재·변색된 금속, 실린더 중심축과 양쪽 지지대 정렬. 손잡이 있는 **둥근 반원통형 덮개를 완전히 분리**합니다. 경첩은 없습니다.
- `phonograph-open-empty.webp`: 열린 빈 축, 태엽 없음.
- `phonograph-open-loaded.webp`: 실린더 삽입, 태엽 없음.
- `phonograph-open-loaded-crank.webp`: 실린더·태엽 삽입.
- `phonograph-closed.webp`: 둥근 덮개를 씌워 보관, 나팔은 분리. 열린 상태와 본체 위치·축척 및 캔버스가 같습니다.
- `phonograph-components.webp`, `component-*.svg`: 실린더/상자/둥근 덮개/나팔/태엽 다섯 독립 파츠.
- `mob-group.webp`, `mob-black.svg`: 편안하게 서 있는 얼굴 없는 모브 세 명과 같은 윤곽의 검은 뒷면. 같은 크기로 재사용합니다.
- `thorn-one-side.webp`: 기존 `FX013_가시덩굴_일자_컬러.png`의 선·명암·색. 가시는 한쪽 면에만, 양 끝은 안쪽으로 아주 살짝 말립니다.
- `earth-wall.webp`: 이전 흙·자갈 시안. 현재 컷은 [목제 이동 방벽](../wooden-wall-20261120/README.md)으로 교체했습니다.
- `contract-full.webp`: 기존 PR002 손글씨 그림을 참고한 공통 원본. **위에만 목제 봉**, 아래는 펼친 종이 끝입니다. 본문은 읽히지 않는 휘갈긴 손글씨, 마지막 조항 제목만 일본어 붓 손글씨 `解約`. 폰트로 조판한 조항은 없습니다.
- `contract-torn.svg`, `contract-tear-*.svg`: 같은 원본의 마지막 조항 절취 상태와 실제 한 장 찢기의 두 절반.
- `BackAlley_Apparition_2-2.webp`, `Lobby_ClockTowerSky_FinalBarrier_BG.webp`, `Lobby_PostBarrierCollapse_StarryNight_BG.webp`: 최신 게임 저장소의 공식 원본 PNG를 표시용으로 변환한 파일. 배경을 생성하거나 다시 칠하지 않았습니다.

새 래스터 그림은 built-in `image_gen`으로 생성했습니다. 검은 뒷면·찢기·분절 뷰는 그림을 내장한 SVG이며 외부 파일 연결 없이 열 수 있습니다. 출력 크기는 뷰어의 준비물 카드와 컷별 출력 규격에 연결됩니다.

배경의 대본 토큰과 등록 주소가 다른 부분은 [검증표](../../motion/background-source-review.md)를 확인하세요.
