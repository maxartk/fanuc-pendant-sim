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

- **Ключ-перемикач режимів** T1 / AUTO / T2 (замість простого ON/OFF)
- **Великий горизонтальний TFT-екран** з landscape layout, status bar (COORD / SPD / MODE / GRP), soft-keys під F1-F5
- **Правий блок осей** 3×8: `STEP / HOLD / FWD / BWD / COORD / GROUP / +% / -%` + парами `-J1/+J1 ... -J8/+J8`
- **Подвійне маркування осей**: `-X (J1)`, `-X̂ (J4)` — у JOINT coord працюють J-підписи, у WORLD/USER/TOOL — X/Y/Z + X̂/Ŷ/Ẑ (обертання)
- **Віртуальні DEADMAN-кнопки** зліва/справа (на реальному пенданті вони на задній стороні). Без утримання DEADMAN jog заблокований
- **Фізичні LED** POWER / FAULT на корпусі
- **Окрема `?` HELP** кнопка (не в центрі навігаційного хреста, як було)
- **Навігація** `◀ ▲ ▼ ▶` горизонтально
- **DISP** як rocker-перемикач
- **DIAG/HELP** знизу зліва
- Надпис **TEACH** над блоком SELECT/EDIT/DATA
- Фірмові кольори: бежева панель, сині кнопки навігації/осей, сірі службові
- **Jog реально рухає позиції** J1-J6 (hold-to-jog через `pointerdown/pointerup`) з урахуванням speed override і STEP/CONTINUOUS, з обмеженнями за осями

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

- Прямий/зворотний TP-редактор (J P[i] 100% FINE, L P[i] 500mm/sec CNT50)
- Справжню пряму кінематику для CARTESIAN view (зараз placeholder)
- Збереження програм у localStorage
- Vibration haptic на натискання (`navigator.vibrate(10)` через Capacitor)
- Alarm log з кодами (SRVO, INTP, SYST)
- User Frame / Tool Frame setup wizards
- Підписаний release APK (keystore у GitHub Secrets)

## 📄 Ліцензія

MIT
