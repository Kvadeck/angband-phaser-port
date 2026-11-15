# План: переписать `z-queue` с C на TypeScript

Учебный план из чата Cursor. Цель — понять кольцевую очередь Angband и перенести её в `src/game/z/queue.ts` в стиле уже сделанного `type.ts`.

**Upstream:** `vendor/angband/src/z-queue.h`, `vendor/angband/src/z-queue.c` (тег 4.2.5)  
**Цель:** `src/game/z/queue.ts` + `src/game/z/queue.test.ts`  
**Статус файлов на момент сохранения плана:** `queue.ts` / `queue.test.ts` пока содержат копию `Loc` (WIP-заготовки), не очередь.

---

## 0. Что ты переносишь одной фразой

В C это **кольцевая очередь фиксированного размера** (circular buffer): «первым пришёл — первым ушёл» (FIFO). В Angband ею пользуются для обхода клеток карты (BFS): положили индекс клетки → достали → положили соседей.

Для Milestone 1 достаточно очереди **чисел** (`number`). Макросы `q_push_ptr` / `q_pop_ptr` для указателей пока не нужны.

---

## 1. Словарь: C ↔ TypeScript

| Идея | C | TypeScript |
|---|---|---|
| Структура с полями | `struct queue { ... }` | `type Queue = { ... }` или класс |
| Целое число | `int`, `size_t`, `uintptr_t` | `number` |
| Массив | `uintptr_t *data` + `malloc` | `number[]` или `Array(size)` |
| Создать объект | `malloc` + заполнить поля | `return { data: [...], ... }` |
| Уничтожить | `free(...)` | **не нужно** — сборщик мусора |
| Паника при ошибке | `abort()` | `throw new Error(...)` |
| Остаток от деления | `%` | `%` (то же) |
| Макрос-обёртка | `#define q_push_int(...)` | обычная функция или не нужна |

`uintptr_t` в C — «целое, в которое можно положить указатель». В очереди Angband туда кладут и числа, и указатели. В TS для M1 кладём просто `number`.

---

## 2. Что такое кольцевая очередь

Обычный массив:

```
индексы:  0  1  2  3  4
данные:  [A][B][C][ ][ ]
              ^head   ^tail (следующая свободная)
```

- **head** — откуда **достаём** (начало очереди)
- **tail** — куда **кладём** (конец очереди)
- Когда индекс доходит до конца массива, он **прыгает на 0**: `(index + 1) % size`

Почему в C делают `size + 1` слотов, если просят размер `size`?

Чтобы отличать **пустую** очередь от **полной**:

- пустая: `head === tail`
- полная: следующий шаг `tail` совпал бы с `head`

Один слот всегда «пустой запасной». Если просишь вместимость 3, внутри массив длины 4.

---

## 3. Разбор C построчно

### Заголовок `z-queue.h` — «контракт»

```c
struct queue {
    uintptr_t *data;
    size_t size;
    int head;
    int tail;
};
```

Поля:

- `data` — массив элементов
- `size` — длина массива (уже с `+1`)
- `head` / `tail` — индексы

Функции:

| C | Смысл |
|---|---|
| `q_new(size)` | создать очередь на `size` элементов |
| `q_len(q)` | сколько сейчас лежит |
| `q_push(q, item)` | положить в хвост |
| `q_pop(q)` | достать из головы |
| `q_free(q)` | освободить память |

Макросы `q_push_int` / `q_pop_int` — просто приведения типов. В TS они **не нужны**.

### Реализация `z-queue.c`

#### `q_new`

```c
struct queue *q_new(size_t size) {
    struct queue *q = (struct queue*)malloc(sizeof(struct queue));
    if (!q) return NULL;
    q->data = (uintptr_t*)malloc(sizeof(uintptr_t) * (size + 1));
    q->size = size + 1;
    q->head = 0;
    q->tail = 0;
    return q;
}
```

Алгоритм:

1. Выделить структуру
2. Выделить массив длины `size + 1`
3. Запомнить эту длину в `q->size`
4. `head = tail = 0` (пусто)
5. Вернуть указатель

В TS шаг 1–2 = один объект с массивом. `NULL` при нехватке памяти в браузере почти не бывает — можно просто создать объект.

#### `q_len`

```c
int q_len(struct queue *q) {
    int len;
    if (q->tail >= q->head) {
        len = q->tail - q->head;
    } else {
        len = q->size - q->head + q->tail;
    }
    return len;
}
```

Два случая:

1. Хвост справа от головы: длина = `tail - head`
2. Очередь «переехала» через край: длина = кусок до конца + кусок от начала

#### `q_push`

```c
void q_push(struct queue *q, uintptr_t item) {
    q->data[q->tail] = item;
    q->tail = (q->tail + 1) % q->size;
    if (q->tail == q->head) abort();
}
```

1. Записать в `data[tail]`
2. Сдвинуть `tail` по кругу
3. Если `tail` догнал `head` — переполнение → `abort()`

#### `q_pop`

```c
uintptr_t q_pop(struct queue *q) {
    uintptr_t item = q->data[q->head];
    if (q->head == q->tail) abort();
    q->head = (q->head + 1) % q->size;
    return item;
}
```

1. Прочитать `data[head]`
2. Если пусто (`head == tail`) — `abort()`
3. Сдвинуть `head`
4. Вернуть значение

Замечание: в C значение читается **до** проверки пустоты. В TS логичнее: сначала проверка, потом чтение.

#### `q_free`

Только для C. В TS не переносим.

---

## 4. Как это должно выглядеть в стиле порта

Уже сделанный `type.ts`:

- `export type ...`
- `export const name = (...) => ...`
- camelCase (`locEq`, не `loc_eq`)
- комментарий `// port of src/...`
- тесты в Vitest

Для очереди тот же стиль. Рекомендуемый API:

```ts
// port of src/z-queue.c — circular integer queue

export type Queue = {
  data: number[]
  size: number
  head: number
  tail: number
}

export const qNew = (capacity: number): Queue => { ... }
export const qLen = (q: Queue): number => { ... }
export const qPush = (q: Queue, item: number): void => { ... }
export const qPop = (q: Queue): number => { ... }
```

`qFree` **не делаем**.

Имена: `qNew` / `qPush` ближе к C (легче сверять с upstream).

Мутабельность: в C очередь меняется на месте. В TS тоже нормально **мутировать** поля `Queue` при `push`/`pop` — это stateful-структура, не как readonly `Loc`.

---

## 5. Пошаговый план работы

### Шаг A — очистить файлы

Сейчас в `queue.ts` лежит код `Loc`. Удали его. Оставь пустой файл или только комментарий:

```ts
// port of src/z-queue.c — circular integer queue
```

В `queue.test.ts` тоже убери тесты `loc` — они уже есть в `type.test.ts`.

### Шаг B — нарисовать на бумаге один сценарий

1. `qNew(3)` → `size = 4`, `head = 0`, `tail = 0`
2. `qPush(q, 10)` → `data[0]=10`, `tail=1`, длина 1
3. `qPush(q, 20)` → `data[1]=20`, `tail=2`, длина 2
4. `qPop(q)` → вернёт `10`, `head=1`, длина 1
5. Ещё push/pop, пока `tail` или `head` не перейдёт через `% size` на `0`

### Шаг C — тип + `qNew`

```
qNew(capacity):
  size = capacity + 1
  return {
    data: массив из size нулей (или Array(size)),
    size,
    head: 0,
    tail: 0
  }
```

В TS: `data: Array<number>(size).fill(0)` или `new Array(size)`.

### Шаг D — `qLen`

```
если tail >= head → tail - head
иначе → size - head + tail
```

### Шаг E — `qPush`

```
записать item в data[tail]
tail = (tail + 1) % size
если tail === head → throw Error('queue overflow')
```

### Шаг F — `qPop`

```
если head === tail → throw Error('queue underflow')
item = data[head]
head = (head + 1) % size
вернуть item
```

### Шаг G — тесты

В `queue.test.ts`:

1. новая очередь → длина 0
2. push 1, 2, 3 → длина 3; pop → 1, потом 2, потом 3
3. после всех pop → длина 0
4. кольцо: заполнить почти до capacity, pop несколько, снова push — порядок FIFO сохраняется
5. push сверх capacity → ошибка
6. pop из пустой → ошибка

### Шаг H — экспорт и parity

1. В `index.ts` добавить `export { qNew, qLen, qPush, qPop, type Queue } from './queue'`
2. В `parity.md` для `z-queue`: статус `parity` (или `partial`, если без ptr-макросов), notes: integer-only, no `q_free`, overflow → throw

---

## 6. Частые ловушки новичка

1. **Забыть `+1` в размере** — тогда нельзя отличить пусто/полно.
2. **Перепутать head и tail** — push двигает tail, pop двигает head.
3. **Сделать `qFree`** — в JS не нужно.
4. **Скопировать `abort` как `return`** — лучше `throw`, чтобы тест это поймал.
5. **Использовать `Array.push`/`shift` вместо кольца** — для обучения порта лучше повторить C-алгоритм `% size`.
6. **Сделать очередь generic `Queue<T>` сразу** — для M1 достаточно `number`.

---

## 7. Что считать «готово»

- [ ] `queue.ts` — 4 функции + тип, логика как в C
- [ ] `queue.test.ts` — FIFO, длина, кольцо, overflow/underflow
- [ ] экспорт из `src/game/z/index.ts`
- [ ] строка в `parity.md` обновлена
- [ ] в файле нет чужого кода `Loc`

---

## 8. Шпаргалка соответствия имён

| C | TypeScript (предложение) |
|---|---|
| `struct queue` | `type Queue` |
| `q_new` | `qNew` |
| `q_len` | `qLen` |
| `q_push` | `qPush` |
| `q_pop` | `qPop` |
| `q_free` | — |
| `q_push_int` / `q_pop_int` | те же `qPush` / `qPop` |
| `abort()` | `throw new Error(...)` |

---

## Где смотреть в upstream

Очередь реально используется для BFS по клеткам, например:

- `vendor/angband/src/gen-cave.c` — `q_new` / `q_push_int` / `q_pop_int` / `q_free`
- `vendor/angband/src/game-world.c` — то же для обхода карты

Это поможет понять *зачем* очередь, а не только *как* она устроена.
