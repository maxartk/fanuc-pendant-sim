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
