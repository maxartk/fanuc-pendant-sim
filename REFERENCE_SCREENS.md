# FANUC iPendant — Довідник екранів (1:1 копія)

Джерела:
- Industrial Robotics Wiki: https://industrialrobotics.miraheze.org/wiki/MENU
- FANUC R-30iB/R-30iB Plus Operator's Manual B-83284EN
- FANUC iPendant Operator Manual B-81464EN

---

## 🖥️ MENU (кнопка MENU) — Повна структура

Натискання кнопки MENU відкриває спливаюче меню з 17 пунктами (2 сторінки):

### Сторінка 1 (1-9):
| № | Екран | Піункти |
|---|-------|---------|
| 1 | **UTILITIES** | Hints, iRCalibration, Prog Adjust, Program Shift, Mirror Image Shift, Tool Offset, Frame Offset, Angle Entry Shift, Group Excng |
| 2 | **TEST CYCLE** | *(порожньо — для тестових циклів)* |
| 3 | **MANUAL FCTNS** | *(порожньо — функції ручного керування)* |
| 4 | **ALARM** | Alarm Log, Motion Log, System Log, Appl Log, Comm Log, Haptic Log |
| 5 | **I/O** | Cell Intface, Custom, Digital, Analog, Group, Robot, UOP, SOP, Interconnect, Link Device, Flag |
| 6 | **SETUP** | Prog Select, General, Coll Guard, Frames, Macro, Ref Position, Port Init, Ovrd Select, User Alarm, Error Table, iPendant Setup, BG Logic, Resume Tol., Haptic, Host Comm, Diag Video Mon |
| 7 | **FILE** | File, File Memory, S/W Install, Auto Backup |
| 8 | **iRVision** | Vision Setup, Vision Runtime, Vision Log, Vision Config, Vision Utilities |
| 9 | **USER** | *(кастомні екрани користувача)* |

### Сторінка 2 (10-17) — натиснути NEXT:
| № | Екран | Піункти |
|---|-------|---------|
| 10 | **SELECT** | Список TP-програм (F1 CREATE, F2 COPY, F3 DEL, F4 DETAIL) |
| 11 | **EDIT** | TP-редактор (F1 INSERT, F2 MODIFY, F3 DEL, F4 UNDO) |
| 12 | **DATA** | Registers, Position Reg, String Reg, Vision Reg, Pallet Register, KAREL Vars, KAREL Posns |
| 13 | **STATUS** | Axis, Version ID, Stop Signal, Exec-hist, Memory, Prg Timer, Sys Timer, Condition, Program, Notifications |
| 14 | **4D GRAPHICS** | 4D Display, Position Display |
| 15 | **SYSTEM** | Clock, Variables, OT Release, Axis Limits, Config, Motion, PayLoadCheck, DCS |
| 16 | **USER2** | *(кастомні екрани користувача 2)* |
| 17 | **BROWSER** | *(вбудований браузер — тільки на iPendant Touch)* |

---

## 📍 POSITION — Екран позиції

Натискається кнопкою POSN або через MENU.

### F1-F5 Soft Keys:
| F1 | F2 | F3 | F4 | F5 |
|----|-----|-----|-----|------|
| JOINT | USER | WORLD | TOOL | JGFRM |

### JOINT формат (F1):
```
┌─────────────────────────────────────┐
│ POSITION (JOINT)          R-30iB    │
│                                     │
│ J1  +0.000    °                     │
│ J2  -90.000   °                     │
│ J3  +0.000    °                     │
│ J4  +0.000    °                     │
│ J5  +0.000    °                     │
│ J6  +0.000    °                     │
│                                     │
│ E1  +0.000    °    (якщо є)         │
│ E2  +0.000    °    (якщо є)         │
│                                     │
│ UTOOL_NUM: 1    UFRAME_NUM: 1      │
│ CFG: N U T  0 0 0                  │
│                                     │
│ F1 JOINT F2 USER F3 WORLD F4 TOOL  │
│                          F5 JGFRM   │
└─────────────────────────────────────┘
```

### CARTESIAN формат (F2-F5):
```
┌─────────────────────────────────────┐
│ POSITION (USER)           R-30iB     │
│                                     │
│  X  +0.000    mm                    │
│  Y  +0.000    mm                    │
│  Z  +0.000    mm                    │
│  W  +0.000    °                     │
│  P  +0.000    °                     │
│  R  +0.000    °                     │
│                                     │
│ CONFIG: N U T  0 0 0                │
│ E1  +0.000    °                     │
│                                     │
│ UTOOL_NUM: 1    UFRAME_NUM: 1      │
│                                     │
│ F1 JOINT F2 USER F3 WORLD F4 TOOL   │
│                          F5 JGFRM   │
└─────────────────────────────────────┘
```

CFG (Configuration) — 3 літери + 3 цифри:
- **N**=Non-flip / **F**=Flip
- **U**=Up / **D**=Down
- **T**=Top / **B**=Bottom
- Далі: 3 числа — turn numbers (0-9)

---

## 📊 STATUS — Екран статусу

### F1 AXIS:
```
┌─────────────────────────────────────┐
│ STATUS / AXIS              R-30iB   │
│                                     │
│          CURRENT   COMMAND           │
│ J1      +0.000    +0.000     °      │
│ J2      -90.000   -90.000    °      │
│ J3      +0.000    +0.000     °      │
│ J4      +0.000    +0.000     °      │
│ J5      +0.000    +0.000     °      │
│ J6      +0.000    +0.000     °      │
│                                     │
│ Speed: 100%                         │
│                                     │
│ F1 AXIS  F2 SAFETY  F3 VERSION      │
│          F4 MEMORY   F5 >           │
└─────────────────────────────────────┘
```

### F2 SAFETY:
```
┌─────────────────────────────────────┐
│ STATUS / SAFETY             R-30iB  │
│                                     │
│ E-STOP:      ON                     │
│ DEADMAN:     OFF                    │
│ HOLD:        OFF                    │
│ FAULT:       OFF                    │
│ DCS:         OK                     │
│                                     │
│ F1 AXIS  F2 SAFETY  F3 VERSION      │
│          F4 MEMORY   F5 >           │
└─────────────────────────────────────┘
```

### F3 VERSION — версія ПЗ контролера
### F4 MEMORY — використання пам'яті (TP/KAREL)
### F5 > (друга сторінка soft keys):
| F1 | F2 | F3 | F4 | F5 |
|----|-----|-----|-----|------|
| Prg Timer | Sys Timer | Condition | Program | Notifications |

---

## 📋 SELECT — Екран вибору програм

```
┌─────────────────────────────────────┐
│ PROGRAM SELECT             R-30iB   │
│                                     │
│  PROGRAM  COMMENT                   │
│  HOME.TP                            │
│  SAMPLE1.TP  Test program           │
│  TEST.TP                             │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│ F1 CREATE  F2 COPY  F3 DEL          │
│            F4 DETAIL F5 >           │
└─────────────────────────────────────┘
```

### F4 DETAIL:
```
┌─────────────────────────────────────┐
│ PROGRAM DETAIL             R-30iB   │
│                                     │
│ Program: HOME.TP                    │
│ Comment: Home position              │
│ Size: 52 bytes                      │
│ Created: 2026/04/01 10:00          │
│ Modified: 2026/04/25 15:30         │
│                                     │
│ Sub Type:                           │
│                                     │
│ F1 PREV   F2        F3             │
│ F4        F5                       │
└─────────────────────────────────────┘
```

---

## ✏️ EDIT — TP-редактор

```
┌─────────────────────────────────────┐
│ EDIT / HOME.TP              R-30iB  │
│                                     │
│  1: /PROG HOME                      │
│  2: /ATTR                            │
│  3: J P[1]  100%  FINE              │
│  4: L P[2]  500mm/sec  CNT50       │
│  5: CALL SUB1                        │
│  6: L P[3]  300mm/sec  FINE         │
│  7: END                              │
│                                     │
│  ► (курсор на рядку 3)              │
│                                     │
│ F1 INSERT  F2 MODIFY  F3 DEL       │
│            F4 UNDO    F5 >         │
└─────────────────────────────────────┘
```

---

## 📐 DATA — Екран даних

### F1 [TYPE] — перемикання між типами:
- R[] — Numeric Registers (1-100+)
- PR[] — Position Registers (1-100+)
- SR[] — String Registers (1-25+)
- Vision Reg — Vision Registers
- Pallet Register — Pallet Registers

### Registers (R[]) — Екран:
```
┌─────────────────────────────────────┐
│ DATA / REGISTER            R-30iB   │
│                                     │
│  REGISTER    VALUE     COMMENT      │
│  R[1]         0                      │
│  R[2]         0                      │
│  R[3]         0                      │
│  R[4]         0                      │
│  R[5]         0                      │
│  ...                                │
│                                     │
│ F1 [TYPE]  F2 CLEAR  F3 SET TO     │
│            F4 COMPARE F5 >          │
└─────────────────────────────────────┘
```

### Position Registers (PR[]) — Екран:
```
┌─────────────────────────────────────┐
│ DATA / POSITION REGISTER     R-30iB │
│                                     │
│  PR[1]                              │
│   X   +0.000    mm                  │
│   Y   +0.000    mm                  │
│   Z   +0.000    mm                  │
│   W   +0.000    °                   │
│   P   +0.000    °                   │
│   R   +0.000    °                   │
│                                     │
│ CONFIG: N U T  0 0 0                │
│                                     │
│ F1 PREV  F2 NEXT  F3 CLEAR          │
│          F4 SET TO  F5 CURR         │
└─────────────────────────────────────┘
```

---

## 🔌 I/O — Екран вводу/виводу

### F1 [TYPE] — циклічний перемикач:
DI → DO → UI → UO → RI → RO → AI → AO → GI → GO → SI → SO → Flag

### Digital Input (DI):
```
┌─────────────────────────────────────┐
│ I/O / DIGITAL INPUT         R-30iB  │
│                                     │
│  RANGE    RACK  SLOT  START  DIO   │
│  DI[1]     0     1      1     ON    │
│  DI[2]     0     1      2     OFF   │
│  DI[3]     0     1      3     ON    │
│  DI[4]     0     1      4     OFF   │
│  DI[5]     0     1      5     OFF   │
│                                     │
│                                     │
│                                     │
│ F1 [TYPE]  F2 ON    F3 OFF         │
│            F4 SIM    F5 >           │
└─────────────────────────────────────┘
```

- **F2 ON** — увімкнути вибраний DI/DO
- **F3 OFF** — вимкнути вибраний DI/DO
- **F4 SIM** — симуляція I/O

---

## 🔔 ALARM — Екран аварій

### Активні аларми:
```
┌─────────────────────────────────────┐
│ ALARM / ACTIVE              R-30iB   │
│                                     │
│  ALARM                               │
│  SRVO-002  E-STOP                    │
│  SRVO-001  Deadman released          │
│  SYST-026  Password not set          │
│                                     │
│                                     │
│                                     │
│                                     │
│ F1 HIST   F2 RES_1ALM  F3 CLEAR    │
│           F4 HELP     F5 >          │
└─────────────────────────────────────┘
```

- **F1 HIST** — історія алармів (з часом і датою)
- **F2 RES_1ALM** — скинути один аларм
- **F3 CLEAR** — скинути всі аларми
- **F4 HELP** — допомога по коду аларму

### HISTORY (F1):
```
┌─────────────────────────────────────┐
│ ALARM / HISTORY             R-30iB   │
│                                     │
│  DATE       TIME     ALARM          │
│  04/25/26   15:30   SRVO-002        │
│  04/25/26   14:20   SRVO-001        │
│  04/24/26   09:10   SYST-026        │
│                                     │
│                                     │
│                                     │
│ F1 HIST   F2 RES_1ALM  F3 CLEAR    │
│           F4 HELP     F5 >          │
└─────────────────────────────────────┘
```

---

## ⚙️ SETUP — Екран налаштувань

### Структура підменю SETUP:
| Пункт | Опис |
|-------|------|
| Prog Select | Вибір програми для автозапуску |
| General | Загальні налаштування |
| Coll Guard |Collision Guard (захист від зіткнень) |
| Frames | User Frame / Tool Frame setup |
| Macro | Макроси |
| Ref Position | Reference Positions (P1-P3) |
| Port Init | Ініціалізація портів |
| Ovrd Select | Вибір override |
| User Alarm | Кастомні аварії користувача |
| Error Table | Таблиця помилок |
| iPendant Setup | Налаштування дисплея |
| BG Logic | Background Logic |
| Resume Tol. | Resume Tolerance |
| Haptic | Налаштування haptic |
| Host Comm | Комунікація з хостом |
| Diag Video Mon | Відео моніторинг |

---

## 📁 FILE — Екран файлів

```
┌─────────────────────────────────────┐
│ FILE / DEVICE              R-30iB    │
│                                     │
│  DEVICE: MC:                        │
│                                     │
│  DIRECTORY                          │
│  .TP      52  HOME.TP               │
│  .TP      256  SAMPLE1.TP           │
│  .TP      128  TEST.TP              │
│                                     │
│                                     │
│                                     │
│ F1 [TYPE]  F2 COPY   F3 DEL         │
│            F4 MKDIR  F5 UTIL        │
└─────────────────────────────────────┘
```

- **F1 [TYPE]** — MC: / UD1: / FR:
- **F2 COPY** — копіювати файл
- **F3 DEL** — видалити файл
- **F4 MKDIR** — створити папку
- **F5 UTIL** — утиліти

---

## 🖼️ PICTURE — Екран візуалізації робота

```
┌─────────────────────────────────────┐
│ PICTURE                     R-30iB  │
│                                     │
│    ___                              │
│   /   \    ← J2 ( Shoulders )       │
│  |     |                            │
│   \___/                             │
│     |     ← J3 ( Elbow )           │
│     |                               │
│    / \    ← J5,J6 (Wrist)          │
│                                     │
│  J1: +0.000°   J2: -90.000°        │
│  J3: +0.000°   J4: +0.000°         │
│  J5: +0.000°   J6: +0.000°         │
│                                     │
│ F1 TOP  F2 FRONT  F3 SIDE          │
│         F4 WIRE    F5 ZOOM          │
└─────────────────────────────────────┘
```

---

## ⌨️ FCTN — Меню функцій

Натискається кнопкою **FCTN**:

```
┌─────────────────────────────────────┐
│ FUNCTION                            │
│                                     │
│ 1  ABORT (ALL)                      │
│ 2  END                              │
│ 3  UNLOCK TP                        │
│ 4  ENABLE TP                        │
│ 5  RESET ALL                        │
│ 6  OVERRIDE 100%                    │
│ 7  CYCLE POWER                      │
│ 8  QUICK MOTION                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔑 Фізичні кнопки пенданта

### Верхня смуга (Status Bar):
```
┌────────────────────────────────────────────────────────────┐
│ [T1] [▶]  R-30iB  [100%]  [ON]  [OFF]  [FAULT]          │
│ Mode   Run   Controller Override  DI   DO   Status        │
└────────────────────────────────────────────────────────────┘
```

- **Режим** (T1/AUTO/T2) — задається ключем
- **Run** — програма виконується (▶)
- **Override** — швидкість (0-100%)
- **DI/DO** — статус цифрових входів/виходів (іконки ON/OFF)
- **Fault** — червоний індикатор аварії

### Клавіатура правого блоку (3×8):
```
┌─────── первой рядок ───────┐
│ STEP │ HOLD │  FWD │  BWD  │
├──────┼──────┼──────┼───────┤
│COORD │GROUP │  +%  │  -%   │
├──────┼──────┼──────┼───────┤
│  J1  │  J2  │  J3  │  J4   │
├──────┼──────┼──────┼───────┤
│  J5  │  J6  │  J7  │  J8   │
├──────┼──────┼──────┼───────┤
│  +X  │  +Y  │  +Z  │ SHIFT │
├──────┼──────┼──────┼───────┤
│  -X  │  -Y  │  -Z  │COMM.  │
└──────┴──────┴──────┴───────┘
```

### Спеціальні кнопки:
- **E-STOP** — червона велика кнопка (замок)
- **DEADMAN (L/R)** — треба тримати для jog
- **SHIFT** — тогл (підсвічується)
- **MENU** — відкриває System Menu
- **SELECT** — вибір програм
- **EDIT** — редактор TP
- **DATA** — регістри (R/PR/SR)
- **POSN** — позиція робота
- **FCTN** — функціональне меню
- **RESET** — скидання FAULT
- **ENTER** — підтвердження
- **BACK** — назад

---

## 📇 Коди аварій (найпоширеніші)

| Код | Опис | Дія |
|-----|------|------|
| SRVO-001 | Deadman released | Тримати deadman |
| SRVO-002 | E-STOP | Відпустити E-STOP, RESET |
| SRVO-003 | Deadman abnormal | Перевірити deadman |
| SRVO-004 | Fence open | Закрити огорожу |
| SRVO-007 | External E-STOP | Зняти зовнішній E-STOP |
| SRVO-012 | Power failure | RESET |
| SRVO-013 | Pulse not ready | RESET |
| SRVO-023 | Excess error | Перевірити навантаження |
| SRVO-050 | Collision detect | Відвести робота |
| SYST-026 | Password not set | Встановити пароль |
| INTP-001 | Division by zero | Перевірити програму |
| PROG-001 | Program not found | Вибрати існуючу програму |

---

## 🔗 Ключові зображення-референси

1. **MENU popup** — повна структура меню:
   https://static.wikitide.net/industrialroboticswiki/thumb/0/01/The_MENU_popup.png/500px-The_MENU_popup.png

2. **iPendant анотована схема** (всі кнопки і зони):
   https://help.dragandbot.com/hardware/robots/fanuc/images/FanucTeachPendant_annotated_extended.PNG

3. **I/O екран** — приклад DI/DO:
   https://help.dragandbot.com/hardware/robots/fanuc/images/ExampleControllerIOs.PNG

4. **Офіційний iPendant (велике фото)**:
   https://www.fanuc.co.jp/ja/product/new_product/2017/image/ipendant_large.jpg

5. **R-30iB Plus екран POSITION**:
   https://3.bp.blogspot.com/-O8iXbL-46lo/WZFxyYHgbcI/AAAAAAAAEaQ/LEivujbcC_UIWwG3nqOC6FCefvJJJSFdACLcBGAs/s1600/R-30iB+Plus_101.jpg