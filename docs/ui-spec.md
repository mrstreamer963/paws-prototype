# UI Spec — Tailwind CSS + панели управления

## Цель

Подключить Tailwind CSS к пакету `@paws/ui` и реализовать механизмы управления логическими панелями:
- сворачивание/разворачивание секций внутри панелей
- появление/скрытие целых боковых панелей
- раскрытие панели на весь экран (fullscreen)

---

## 1. Подключение Tailwind CSS v4

### Установленные зависимости (devDependencies)

- `tailwindcss@^4.3.1`
- `@tailwindcss/vite@^4.3.1`

### Настройка Vite

**Файл:** `packages/ui/vite.config.ts`

Добавлен плагин `tailwindcss()` в список плагинов Vite:

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // ...
})
```

### CSS-токены

**Файл:** `packages/ui/src/styles/tokens.css`

В начало файла добавлены:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0b0f12;
  --color-panel: #121820;
  --color-panel-elevated: #161e28;
  --color-border: #1e2a36;
  --color-accent: #4ecdc4;
  --color-warn: #f0a500;
  --color-danger: #e74c3c;
  --color-success: #2ecc71;
  --color-text: #c8d4dc;
  --color-muted: #6b7d8a;
  --font-family-display: 'Rajdhani', system-ui, sans-serif;
}
```

Это позволяет использовать Tailwind-классы вида `bg-panel`, `text-accent`, `border-border` и т.д. во всех компонентах. Старые CSS-переменные (`--bg`, `--panel` и т.д.) сохранены для обратной совместимости с существующими стилями.

---

## 2. Новые компоненты

### 2.1. `CollapsiblePanel`

**Файл:** `packages/ui/src/components/CollapsiblePanel.tsx`

Сворачиваемая секция с заголовком-кнопкой.

**Props:**
- `title: string` — заголовок секции
- `defaultOpen?: boolean` — открыта ли по умолчанию (по умолчанию `true`)
- `children: ReactNode` — содержимое
- `className?: string` — дополнительные CSS-классы

**Поведение:**
- Клик по заголовку сворачивает/разворачивает содержимое
- Анимация через `max-h` и `opacity` (transition duration-200)
- Стрелка `▾` поворачивается при открытии

### 2.2. `DrawerPanel`

**Файл:** `packages/ui/src/components/DrawerPanel.tsx`

Выезжающая панель сбоку (drawer).

**Props:**
- `open: boolean` — видимость панели
- `onClose: () => void` — колбэк закрытия
- `title: string` — заголовок
- `children: ReactNode` — содержимое
- `side?: 'left' | 'right'` — с какой стороны выезжает (по умолчанию `right`)

**Поведение:**
- Анимация через `translate-x` (transform transition duration-300)
- Полупрозрачный оверлей при открытии
- Закрытие по клику на оверлей
- Закрытие по клавише Escape

### 2.3. `FullscreenPanel`

**Файл:** `packages/ui/src/components/FullscreenPanel.tsx`

Обёртка, позволяющая раскрыть содержимое на весь экран.

**Props:**
- `title: string` — заголовок (отображается в fullscreen-режиме)
- `children: ReactNode` — содержимое
- `className?: string` — дополнительные CSS-классы

**Поведение:**
- В обычном режиме кнопка `⛶` появляется при наведении на панель (opacity-0 → opacity-100)
- В fullscreen-режиме панель занимает весь экран (`fixed inset-0 z-50`)
- Закрытие по кнопке `✕` или по клавише Escape

### 2.4. `usePanelState`

**Файл:** `packages/ui/src/hooks/usePanelState.ts`

Хук для управления видимостью левой и правой боковых панелей.

**Возвращает:**
- `leftOpen: boolean`
- `rightOpen: boolean`
- `toggleLeft: () => void`
- `toggleRight: () => void`

---

## 3. Изменения в существующих компонентах

### 3.1. `AppShell`

**Файл:** `packages/ui/src/components/AppShell.tsx`

- Импортирован `FullscreenPanel` и `usePanelState`
- `MissionMap` обёрнут в `<FullscreenPanel title="Mission Map">`
- Левая и правая панели рендерятся условно: `{leftOpen && <LeftSidebar ... />}`
- В `HeaderBar` передаются пропсы `leftOpen`, `rightOpen`, `onToggleLeft`, `onToggleRight`

### 3.2. `HeaderBar`

**Файл:** `packages/ui/src/components/HeaderBar.tsx`

- Добавлены пропсы: `leftOpen`, `rightOpen`, `onToggleLeft`, `onToggleRight`
- Добавлены две кнопки между брендом и ресурсами:
  - `◀ L` / `L ▶` — скрыть/показать левую панель
  - `R ▶` / `◀ R` — скрыть/показать правую панель

### 3.3. `layout.css`

**Файл:** `packages/ui/src/styles/layout.css`

- Добавлен `transition: grid-template-columns 0.2s ease` на `.app-shell` для плавности при скрытии/показе панелей

---

## 4. Использование

### Сворачивание секции внутри панели

```tsx
import { CollapsiblePanel } from './CollapsiblePanel'

<CollapsiblePanel title="Objectives">
  {/* содержимое */}
</CollapsiblePanel>
```

### Drawer-панель

```tsx
import { DrawerPanel } from './DrawerPanel'
import { useState } from 'react'

const [open, setOpen] = useState(false)

<DrawerPanel open={open} onClose={() => setOpen(false)} title="Squad Details">
  {/* содержимое */}
</DrawerPanel>
```

### Fullscreen для любой панели

```tsx
import { FullscreenPanel } from './FullscreenPanel'

<FullscreenPanel title="Mission Map">
  <MissionMap state={state} />
</FullscreenPanel>
```

### Скрытие/показ боковых панелей

Кнопки в хедере (`◀ L` / `L ▶` и `R ▶` / `◀ R`) управляются через хук `usePanelState`.

---

## 5. Зависимости

- `tailwindcss@^4.3.1` (MIT, бесплатно)
- `@tailwindcss/vite@^4.3.1` (MIT, бесплатно)