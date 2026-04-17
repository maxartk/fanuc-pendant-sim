# FANUC R-30iA Teach Pendant Simulator

Симулятор пенданта навчання FANUC R-30iA для Android.

## 📱 Завантажити APK

APK автоматично будується через GitHub Actions. Завантажте останню версію з:

**[Releases](https://github.com/YOUR_USERNAME/fanuc-pendant-sim/releases)**

Або білд з Actions:
1. Перейдіть на вкладку **Actions**
2. Виберіть **Build Android APK**
3. Клікніть на артефакт **fanuc-pendant-apk**

## 🎮 Функції

- **Повний інтерфейс** R-30iA пенданта
- **Екран** з меню (DISPLAY, SETUP, PROGRAM, SYSTEM)
- **Всі кнопки**: F1-F5, SHIFT, MENU, SELECT, EDIT, DATA, FCTN
- **Навігація**: стрілки, ENTER, BACK SPACE
- **Цифрова клавіатура**
- **Управління осями J1-J6** з регулюванням швидкості
- **E-STOP** кнопка
- **COORD, STEP, HOLD, FWD/BWD** перемикачі
- **Відображення положення** суглобів в реальному часі

## 🕹️ Керування

| Кнопка | Опис |
|--------|------|
| MENU | Головне меню |
| SELECT | Вибір програми |
| EDIT | Режим редагування |
| DISP | Дисплей |
| RESET | Скидання помилок |
| E-STOP | Аварійна зупинка |
| JOINT/JOG/WORLD/TOOL | Система координат |
| STEP | Покроковий режим |
| HOLD | Пауза |
| FWD/BWD | Вперед/Назад |

## 🔧 Структура проекту

```
fanuc-pendant-sim/
├── index.html          # Головний HTML файл
├── www/                # Веб- assets (копія index.html)
├── capacitor.config.json
├── package.json
├── .github/
│   └── workflows/
│       └── build.yml   # GitHub Actions для збірки APK
└── README.md
```

## 🏗️ Збірка

### Веб-версія (локально)

```bash
npm install
npx cap serve
```

### Android APK (через GitHub Actions)

Просто пуш в main — APK автоматично збирається!

### Локальна збірка Android (потрібен Android SDK)

```bash
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK буде в: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📄 Ліцензія

MIT
