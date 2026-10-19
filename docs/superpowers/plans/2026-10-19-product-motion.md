# Product motion implementation plan

**Goal:** Единое тихое появление всех продуктовых поверхностей без помех действиям.
**Architecture:** Существующий hook useEntranceMotion на границах навигации + scoped CSS для overlays и feedback. Без новых зависимостей и без наблюдателя за DOM.
**Tech Stack:** React, WAAPI, CSS, Vitest, Chromium.

- [x] Уточнить тесты startEntrance: читаемая начальная opacity, лимит 12, отсутствие движения страниц и анимации уведомлений, отмена при focus/wheel.
- [x] Обновить hook и CSS, сохранить stable navigation и reduced-motion.
- [x] Добавить границы переходов PracticeStart, PublicProfilePreview, Communication(selected), ServicesFinance(view). Не использовать данные/поиск как ключ перехода.
- [x] Build/test; браузер с записью animate calls: навигация да, поиск/ввод нет, отмена по действию, меню/формы, все 8 demo modes, mobile и reduce.
- [x] Объединить только изменения задачи с общей локальной копией, проверить 5192; не публиковать.

## Проверка

488 тестов проходят. Production build и TypeScript проходят. Chromium с инструментированным Element.animate: 8 demo modes, duration+delay <=220ms, opacity >=.7, группы без transform, поиск/ввод не перезапускают анимацию, выбранный разговор запускает, черновик сохраняется. Keyboard прерывает motion. Mobile 390 px и reduced-motion проверены, drawer использует ep-drawer-enter либо none. Общая локальная копия объединена без перезаписи параллельных UI-изменений; build и typecheck 5192 проходят.
