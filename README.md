# FANUC iPendant Simulator

Симулятор навчального пенданта FANUC iPendant (контролер **R-30iA / R-30iB**, маніпулятор **R-2000iC**) для Android і браузера.

Розкладка й стиль максимально наближені до реального iPendant моделі `GNE2`.

## 📱 Завантажити APK

APK автоматично збирається через GitHub Actions. Завантаж останній білд:

**[Releases](https://github.com/maxartk/fanuc-pendant-sim/releases)**

Або артефакт з Actions:

1. Перейди на вкладку **Actions**
2. Вибери останній запуск **Build Android APK**
3. Завантаж артефакт **fanuc-pendant-apk**

## 🎮 Що зроблено у v2

Оновлений layout під реальний iPendant (див. фото референс):

- **Ключ-перемикач режимів** T1 / AUTO / T2
- **TFT-екран** landscape з status bar, soft-keys F1-F5
- **Правий блок осей** 3×8: STEP/HOLD/FWD/BWD/COORD/GROUP/+%/-% + J1-J8
- **DEADMAN-кнопки** — без утримання jog заблокований
- **Jog реально рухає** J1-J6 позиції з обмеженнями

## ✅ Що додано у v3 (NEW)

### **SELECT — Програми**
- Список TP-програм (HOME.TP, SAMPLE1.TP, TEST.TP)
- F1 CREATE — створити нову програму
- F2 COPY — копіювати програму
- F3 DEL — видалити програму
- F4 DETAIL — інформація про програму
- ENTER — відкрити редактор

### **EDIT — TP-редактор**
- TP-код з номерами строк: `/PROG`, `/ATTR`, `J P[i]`, `L P[i]`, `CALL`, `END`
- F1 INSERT — вставити строку
- F2 MODIFY — змінити строку
- F3 DEL — видалити строку
- F4 UNDO — undo последню зміну
- ENTER — редагувати строку

### **SYSTEM — Системні переменні**
- $SYSTEM[1-9] — editable
- ENTER — змінити значение

### **DISP — Split screen**
- Toggle split/full screen

### **Меню повністю**
- MENU → System Menu (1-9 + NEXT → page 2)
- UTILITIES, TEST CYCLE, MANUAL FCTNS, ALARM, I/O, SETUP, FILE, USER, SELECT, EDIT, DATA, STATUS, POSITION, SYSTEM

## 🆕 Що додано у v4 (LATEST)

### **Нові кнопки Program Edit**
- **POSITION** — швидкий доступ до екрану POSITION
- **CORRECT** — корекція позицій у TP програмі
- **PLACE** — вставка поточної позиції в програму
- **FINE** — вибір типу завершення руху (FINE/CNT)
- **INCRTYPE** — перемикання JOINT/CARTESIAN
- **TOUCHUP** — оновлення позиції до поточної
- **ORDER** — сортування програм

### **Покращений екран POSITION**
- Детальне відображення JOINT координат (J1-J6) з виділенням курсора
- CARTESIAN координати (X, Y, Z, W, P, R) з одиницями виміру
- CFG (configuration) параметри
- UTOOL_NUM / UFRAME_NUM відображення
- F1-F5 швидке перемикання: JOINT, USER, WORLD, TOOL, JGFRM

### **Новий екран OFFSET (PR Registers)**
- Перегляд/редагування Position Registers (PR[1-10])
- F1 PREV / F2 NEXT — перемикання між PR
- F3 CLEAR — очистити PR
- F5 CURR — записати поточну позицію в PR
- ENTER — редагування окремих значень (X, Y, Z, W, P, R)

### **Новий екран PICTURE**
- ASCII-візуалізація робота R-2000iC/165F
- Відображення поточних кутів J1, J2, J3 в реальному часі
- F1-F5 зміна кута огляду (TOP, FRONT, SIDE, WIRE, ZOOM)

### **Покращений ALARM екран**
- Активні алерми з кодами (SRVO-002, SRVO-001, SYST-026)
- Історія алермів
- F2 RES_1ALM / F3 CLEAR — скидання алермів

## 🎮 Повний функціонал F1-F5 Soft Keys

### **POSITION екран**
| F1 | F2 | F3 | F4 | F5 |
|----|----|----|----|----|
| JOINT | USER | WORLD | TOOL | JGFRM |

### **STATUS екран**
| F1 AXIS | F2 SAFETY | F3 VERSION | F4 MEMORY | F5 > |
|---------|-----------|------------|-----------|------|
| Позиції J1-J6 | E-Stop/Deadman/Hold | Версія ПЗ | Використання пам'яті | NEXT |

### **DATA екран (R/PR/SR регістри)**
| F1 [TYPE] | F2 CLEAR | F3 SET TO | F4 COMPARE | F5 > |
|-----------|----------|-----------|------------|------|
| R[]↔PR[]↔SR[] | Очистити | Встановити | Порівняти | NEXT |

### **I/O екран (DI/DO/UI/UO/RI/RO/AI/AO)**
| F1 [TYPE] | F2 ON | F3 OFF | F4 SIM | F5 > |
|-----------|-------|--------|--------|------|
| Цикл типів | Увімкнути | Вимкнути | Симуляція | NEXT |

### **SELECT екран (програми)**
| F1 CREATE | F2 COPY | F3 DEL | F4 DETAIL | F5 > |
|-----------|---------|--------|-----------|------|
| Нова програма | Копіювати | Видалити | Інфо | NEXT |

### **EDIT екран (TP редактор)**
| F1 INSERT | F2 MODIFY | F3 DEL | F4 UNDO | F5 > |
|-----------|-----------|--------|---------|------|
| Вставити | Змінити | Видалити | Скасувати | NEXT |

### **ALARM екран**
| F1 HIST | F2 RES_1ALM | F3 CLEAR | F4 HELP | F5 > |
|---------|-------------|----------|---------|------|
| Історія | Скинути 1 | Всі | Допомога | NEXT |

### **OFFSET екран (PR регістри)**
| F1 PREV | F2 NEXT | F3 CLEAR | F4 SET TO | F5 CURR |
|---------|---------|----------|-----------|---------|
| PR[n-1] | PR[n+1] | Очистити | Встановити | Поточна позиція |

### **FILE екран**
| F1 [TYPE] | F2 COPY | F3 DEL | F4 MKDIR | F5 UTIL |
|-----------|---------|--------|----------|---------|
| Фільтр | Копіювати | Видалити | Папка | Утиліти |

### **BACKUP екран**
| F1 DEVICE | F2 BACKUP | F3 | F4 | F5 > |
|-----------|-----------|----|----|------|
| MC:/UD1:/FR: | Запуск | | | NEXT |

## 🕹️ Керування

| Елемент | Поведінка |
| --- | --- |
| Keyswitch | Клік — цикл T1 → AUTO → T2 |
| E-STOP | Тогл, при натиску блокується будь-який рух |
| DEADMAN (L/R) | Треба тримати для jog |
| SHIFT | Тогл (підсвічується) |
| MENU | Відкриває System Menu |
| SELECT / EDIT / DATA / FCTN | Відповідні екрани й меню |
| COORD | Цикл JOINT → JGFRM → WORLD → TOOL → USER (SHIFT+COORD — назад) |
| GROUP | Перемикає group 1 / 2 |
| STEP | Continuous ↔ Step jog |
| HOLD | Призупиняє jog |
| FWD / BWD | Потребує SHIFT |
| +% / -% | Override швидкості ±5% |
| RESET | Скидає FAULT |
| Осі (+/-) | Hold-to-jog, тільки якщо DEADMAN held і нема E-STOP/HOLD/FAULT |

## 🔧 Структура

```
fanuc-pendant-sim/
├── index.html          # Основний UI
├── www/index.html      # Копія для Capacitor
├── package.json
├── .github/workflows/build.yml
└── README.md
```

## 🏗️ Збірка

### Веб (локально)

Відкрий `index.html` у браузері — без збірки.

Або через Capacitor dev-server:
```bash
npm install
npx cap serve
```

### Android APK (GitHub Actions)

Пуш у `main` — APK збереться автоматично в Actions.

### Локальна Android-збірка

```bash
npm install
npx cap add android
npx cap sync android
cd android
chmod +x gradlew
./gradlew assembleDebug
```

Готовий APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🧭 Що ще можна додати (roadmap)

- Справжню пряму кінематику для CARTESIAN view
- Збереження програм у localStorage
- Vibration haptic на натискання
- Alarm log з кодами (SRVO, INTP, SYST)
- User Frame / Tool Frame setup wizards
- Touch-up позиції (move to position, record)
- Візualізація робота в 3D

## 📄 Ліцензія

MIT
