# Event Notifications Implementation Plan

**Goal:** Всплывающие карточки с рабочими переходами к оплате и сообщению.
**Architecture:** WorkspaceUtilities строит общий список событий; read-only snapshots слушают успешные изменения модулей; EventToasts выбирает новые события и сохраняет показанные ID в текущем scope.
**Tech Stack:** React, TypeScript, CSS, Vitest, Playwright; без зависимостей.

- [x] Модель event-notifications.ts + тесты: paid-only, входящие, read/shown suppression, initial cap, новые события, отдельный ID оплаты.
- [x] ModuleKit: dispatch после успешного изменения storage; useModuleSnapshot без записи. WorkspaceUtilities: актуальные snapshots и связанная переписка.
- [x] EventToasts.tsx + scoped CSS: 2 карточки, очередь, закрытие, действие, live-region, reduced-motion, mobile и отложенный показ при dialog.
- [x] ServicesFinance paymentId и Communication hashchange: открыть конкретную оплату/переписку из любого рабочего раздела, включая текущий.
- [x] Vitest/build; браузер desktop/mobile, новая оплата после сохранения, новый входящий message, close/reload/read, модалка, точные переходы, demo scope. Синхронизировать локальный preview 5192, без публикации.

## Проверено

486 тестов проходят, production build проходит. Chromium: реальные CTA к оплате и переписке, в том числе из уже открытого раздела; сохранение ручной оплаты вызывает карточку; новая запись из второй вкладки открывается с актуальными данными; диалог откладывает показ; закрытие и reload не повторяют историю; очередь трёх событий сохраняется. Dark/light 1440 px, mobile 390 и 320 px, reduced-motion. Проверено повторно на собранном preview 5192. Независимое review: три замечания исправлены, повторная проверка без существенных замечаний. Изменения в общей рабочей копии объединены с параллельными правками drawer, прокрутки переписки и финансовых панелей. Без commit/push/deploy.
