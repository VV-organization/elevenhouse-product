# Directory tiles implementation plan

**Goal:** Аккуратный визуальный каталог существующих разделов.
**Architecture:** Сохранить группы/маршруты SectionDirectory в ExtendedArea; обновить только разметку ссылок и scoped section-directory.css.
**Tech Stack:** React/CSS, existing Icon, Chromium, Vitest.

- [x] Иконка и стрелка в верхнем ряду плитки, название внизу. Все прежние href и группы неизменны.
- [x] Scoped сетка, dark/light токены, mobile2cols, стабильные hover/focus, отдельные settings links.
- [x] Build/test и browser QA: полная карта ссылок, desktop/mobile geometry, focus, hover, visual review.
- [x] Синхронизировать только изменения каталога в локальный preview 5192. Не коммитить/публиковать.

Проверено: 488 тестов / 84 файла; сборки product и локального preview успешны. Chromium на 5194 и 5192: 23 ссылки, 5 групп, desktop 1440/1024 и mobile 390/320, обе темы, отсутствие переполнения, стабильный hover и клавиатурный переход. Визуальные снимки: artifacts/directory-tiles-2026-10-19/ в основном workspace.

Коррекция по просьбе пользователя: пять карточек групп, в каждой список подразделов. Отдельные плитки пунктов заменены строками; все 23 перехода сохранены. Повторная проверка 1440 dark/light, 1024, 390, 320 прошла.
