# 2부 배경 원본 검증 · 2026-11-19

CatShinobi `develop`을 `344cb3ceac`에서 최신 `56c577ef651a86bbec2de3682fdae3a95c9ef90a`로 fast-forward 했습니다. `origin/update/20261112`도 최신 `40aa57c43d1f32acfeea5e7532bae13f467a94be`로 확인했습니다. 게임 코드는 수정하지 않았습니다.

`SpecData.bytes`의 `Dialogue` 표, 한국어 StringTable, `Default Local Group.asset`의 Addressables 등록과 `PopupDialogue.SetDialogueText`/`AddressablesUtil.LoadAssetCore`를 대조했습니다. 첫 행에 지정된 `bg_name`이 다음 행에도 계속 사용됩니다.

| 뷰어 컷 | 대본 행 | 게임 대본 bg_name | 페이지에 연결한 공식 원본 |
| --- | --- | --- | --- |
| P2-S01 C01 | 4007001 | `BackAlley_Apparition_2-2` | 같은 이름의 StoryBG PNG · 주소 일치 |
| P2-S12 C01, S18 C02 | 4023001 | `ClockTower_Sky_18-1_FullBloom` | `Lobby_ClockTowerSky_FinalBarrier_BG.png` · 공식 대응 그림 |
| P2-S14 C01, S17 C01 | 4025001 | `City_PetalSky_19-1` | `Lobby_ClockTowerSky_FinalBarrier_BG.png` · 공식 결계 배경 재사용 |
| P2-S26 C01, C03, C05 | 4032001 | `Core_Collapse_Finale-3` | `Lobby_PostBarrierCollapse_StarryNight_BG.png` · 공식 대응 그림 |

첫 번째를 제외한 대본 토큰 세 개는 두 브랜치 모두 해당 주소로 등록되어 있지 않습니다. 실제 로더는 그 이름을 그대로 조회하며 별칭 변환은 없습니다. 따라서 이 세 장면은 저장소만으로 실제 실행 화면을 확정할 수 없습니다. 표의 연결은 **게임에 등록된 공식 그림을 선택한 촬영용 대응안**입니다. 실행 중인 게임에서 직접 확인한 결과라는 뜻은 아닙니다. 특히 대피로 전용 그림은 없으므로 공식 시계탑 결계 그림을 재사용했습니다.

이 교체로 사용자 지정 `01_배경/04_기존_가공_시안` 출처 그림은 2부 및 통합본의 활성 컷에서 사용하지 않습니다. 기존 파일은 삭제하지 않고 이력에 보존합니다. 다른 명시적 재사용 지시(꽃봉오리에서 꽃을 뺀 배경, 1부 배경, 정원)는 유지합니다.

원본 위치:

- `Assets/_Project/Sprite/UI/Sprite/StoryBG/BackAlley_Apparition_2-2.png`
- `Assets/_Project/Sprite/UI/Sprite/LobbyBg/Lobby_ClockTowerSky_FinalBarrier_BG.png`
- `Assets/_Project/Sprite/UI/Sprite/LobbyBg/Lobby_PostBarrierCollapse_StarryNight_BG.png`

뮤게 첫 등장 원문은 Dialogue 4009001~4010025 (`scene_id=2713~2714`)이며, 세나 찻집의 4012001 (`scene_id=2716`)보다 앞입니다. 이때 대본 배경 `ClockTower_Sky_12-1` 역시 등록 이름과 달라, 촬영에서는 공식 `Lobby_ClockTowerSky_Default_BG.png`가 대응 그림입니다.
