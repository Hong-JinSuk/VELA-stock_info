'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MENU_ICON_OPTIONS, resolveMenuIcon } from '@/constants/menu-icons';
import { cn } from '@/lib/utils';
import {
  useAdminMenus,
  useCreateMenu,
  useDeleteMenu,
  useUpdateMenu,
} from '@/lib/services/admin/use-admin-menus';
import { createMenuSchema, type CreateMenuInput } from '@/schemas/menu-schema';
import type { MenuNode, MenuType } from '@/types/menu';
import type { AccessLevel } from '@/types/user';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { createElement, type ComponentType, useState } from 'react';
import { useForm } from 'react-hook-form';

// node.icon(문자열) → 아이콘 컴포넌트 렌더. JSX 로컬 컴포넌트 생성 경고 회피 위해 createElement 사용.
// tabler/lucide 아이콘 prop 타입이 달라 공용 시그니처로 캐스팅.
function MenuIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Cmp = resolveMenuIcon(name) as ComponentType<{ className?: string }>;
  return createElement(Cmp, { className });
}

const LEVEL_OPTIONS: AccessLevel[] = ['GUEST', 'FREE', 'BASIC', 'PRO', 'MAX', 'ADMIN'];
const LEVEL_LABEL: Record<string, string> = {
  GUEST: 'GUEST (비로그인 포함)',
  FREE: 'FREE (로그인 전용)',
  BASIC: 'BASIC 이상',
  PRO: 'PRO 이상',
  MAX: 'MAX 이상',
  ADMIN: 'ADMIN 전용',
};

const TYPE_OPTIONS: MenuType[] = ['FOLDER', 'LINK', 'POPUP'];
const TYPE_LABEL: Record<MenuType, string> = {
  FOLDER: '폴더 (하위 메뉴)',
  LINK: '링크',
  POPUP: '팝업 (새 창)',
};
const TYPE_BADGE: Record<MenuType, string> = {
  FOLDER: '폴더',
  LINK: '링크',
  POPUP: '팝업',
};

type DialogState =
  | { mode: 'create'; parentId: string | null }
  | { mode: 'edit'; node: MenuNode }
  | null;

export default function AdminMenusPage() {
  const { data: tree, isLoading } = useAdminMenus();
  const update = useUpdateMenu();
  const del = useDeleteMenu();
  const [dialog, setDialog] = useState<DialogState>(null);

  const top = [...(tree ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  // 형제 목록에서 index 항목을 dir(-1 위 / +1 아래) 방향 이웃과 sortOrder 교환.
  function move(siblings: MenuNode[], index: number, dir: -1 | 1) {
    const cur = siblings[index];
    const neighbor = siblings[index + dir];
    if (!cur || !neighbor || cur.locked || neighbor.locked) return;
    update.mutate({ id: cur.id, sortOrder: neighbor.sortOrder });
    update.mutate({ id: neighbor.id, sortOrder: cur.sortOrder });
  }

  return (
    <main className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto no-scrollbar p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-xl tracking-tight">메뉴 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground break-keep">
            사이드바 메뉴를 추가·수정·삭제·정렬합니다. 타입: 폴더(하위 메뉴 보유),
            링크(단일 이동), 팝업(새 창). 경로는 기존 라우트를 가리키며 메뉴 추가가
            페이지를 생성하지는 않습니다. 실수 방지를 위해 🔒로 메뉴를 고정하면
            잠금을 풀기 전까지 수정·삭제·이동이 막힙니다.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => setDialog({ mode: 'create', parentId: null })}
        >
          <Plus className="size-4" />새 메뉴
        </Button>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {top.map((node, ti) => {
            const reorder = {
              onUp: () => move(top, ti, -1),
              onDown: () => move(top, ti, 1),
              disableUp: ti === 0,
              disableDown: ti === top.length - 1,
            };
            const common = {
              node,
              reorder,
              onEdit: () => setDialog({ mode: 'edit', node }),
              onDelete: () => del.mutate(node.id),
              onToggleHidden: () =>
                update.mutate({ id: node.id, hidden: !node.hidden }),
              onToggleLock: () =>
                update.mutate({ id: node.id, locked: !node.locked }),
              onMinRole: (minRole: AccessLevel) =>
                update.mutate({ id: node.id, minRole }),
            };

            if (node.type === 'FOLDER') {
              return (
                <FolderGroup
                  key={node.id}
                  {...common}
                  onAddChild={() =>
                    setDialog({ mode: 'create', parentId: node.id })
                  }
                  onMoveChild={move}
                  onEditChild={(child) => setDialog({ mode: 'edit', node: child })}
                  onDeleteChild={(child) => del.mutate(child.id)}
                  onUpdateChild={(child, patch) =>
                    update.mutate({ id: child.id, ...patch })
                  }
                />
              );
            }
            return (
              <div
                key={node.id}
                className="rounded-xl border border-border px-4 py-3"
              >
                <LeafRow {...common} showIcon />
              </div>
            );
          })}
        </div>
      )}

      {dialog && (
        <MenuFormDialog
          state={dialog}
          groups={top}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}

type RowHandlers = {
  node: MenuNode;
  reorder: {
    onUp: () => void;
    onDown: () => void;
    disableUp: boolean;
    disableDown: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
  onToggleLock: () => void;
  onMinRole: (v: AccessLevel) => void;
};

function FolderGroup({
  node,
  reorder,
  onEdit,
  onDelete,
  onToggleHidden,
  onToggleLock,
  onAddChild,
  onMoveChild,
  onEditChild,
  onDeleteChild,
  onUpdateChild,
}: RowHandlers & {
  onAddChild: () => void;
  onMoveChild: (siblings: MenuNode[], i: number, dir: -1 | 1) => void;
  onEditChild: (c: MenuNode) => void;
  onDeleteChild: (c: MenuNode) => void;
  onUpdateChild: (c: MenuNode, patch: Partial<MenuNode>) => void;
}) {
  const children = [...node.children].sort((a, b) => a.sortOrder - b.sortOrder);
  const locked = node.locked;
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between gap-2 bg-secondary/40 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              !open && '-rotate-90',
            )}
          />
          <MenuIcon name={node.icon} className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-semibold text-foreground">
            {node.title}
          </span>
          <TypeBadge type={node.type} />
          <span className="text-xs font-normal text-muted-foreground">
            {children.length}
          </span>
          {node.hidden && <HiddenBadge />}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <ReorderButtons {...reorder} disabled={locked} />
          <HiddenToggle hidden={node.hidden} disabled={locked} onToggle={onToggleHidden} />
          <IconButton title="하위 메뉴 추가" disabled={locked} onClick={onAddChild}>
            <Plus className="size-4" />
          </IconButton>
          <IconButton title="편집" disabled={locked} onClick={onEdit}>
            <Pencil className="size-4" />
          </IconButton>
          <LockToggle locked={locked} onToggle={onToggleLock} />
          <DeleteButton
            label={node.title}
            disabled={locked}
            note={children.length > 0 ? '하위 메뉴도 함께 삭제됩니다.' : undefined}
            onConfirm={onDelete}
          />
        </div>
      </div>

      {/* 측정 불필요한 grid-rows(0fr→1fr) 전환 — 항상 안정적으로 펼쳐짐 */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {children.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              하위 메뉴가 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {children.map((child, ci) => (
                <li key={child.id} className="px-4 py-3">
                  <LeafRow
                    node={child}
                    reorder={{
                      onUp: () => onMoveChild(children, ci, -1),
                      onDown: () => onMoveChild(children, ci, 1),
                      disableUp: ci === 0,
                      disableDown: ci === children.length - 1,
                    }}
                    onEdit={() => onEditChild(child)}
                    onDelete={() => onDeleteChild(child)}
                    onToggleHidden={() =>
                      onUpdateChild(child, { hidden: !child.hidden })
                    }
                    onToggleLock={() =>
                      onUpdateChild(child, { locked: !child.locked })
                    }
                    onMinRole={(minRole) => onUpdateChild(child, { minRole })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function LeafRow({
  node,
  reorder,
  onEdit,
  onDelete,
  onToggleHidden,
  onToggleLock,
  onMinRole,
  showIcon,
}: RowHandlers & { showIcon?: boolean }) {
  const locked = node.locked;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        {showIcon && (
          <MenuIcon name={node.icon} className="size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
            {node.title}
            <TypeBadge type={node.type} />
            {node.disabled && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                준비 중
              </span>
            )}
            {node.hidden && <HiddenBadge />}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/70">
            {node.path}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <MinRoleSelect value={node.minRole} disabled={locked} onChange={onMinRole} />
        <HiddenToggle hidden={node.hidden} disabled={locked} onToggle={onToggleHidden} />
        <ReorderButtons {...reorder} disabled={locked} />
        <IconButton title="편집" disabled={locked} onClick={onEdit}>
          <Pencil className="size-4" />
        </IconButton>
        <LockToggle locked={locked} onToggle={onToggleLock} />
        <DeleteButton label={node.title} disabled={locked} onConfirm={onDelete} />
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: MenuType }) {
  return (
    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {TYPE_BADGE[type]}
    </span>
  );
}

function HiddenBadge() {
  return (
    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
      숨김
    </span>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}

function ReorderButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
  disabled,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        title="위로"
        onClick={onUp}
        disabled={disabled || disableUp}
        className="flex size-8 items-center justify-center rounded-l-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        type="button"
        title="아래로"
        onClick={onDown}
        disabled={disabled || disableDown}
        className="flex size-8 items-center justify-center rounded-r-lg border border-l-0 border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}

function HiddenToggle({
  hidden,
  disabled,
  onToggle,
}: {
  hidden: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={hidden}
      title={hidden ? '사이드바에서 숨김 (클릭하면 표시)' : '사이드바에 표시 중 (클릭하면 숨김)'}
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:opacity-40 ${
        hidden
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
          : 'border-border bg-background text-muted-foreground hover:text-foreground'
      }`}
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      <span>{hidden ? '메뉴 숨김' : '메뉴 표시'}</span>
    </button>
  );
}

function LockToggle({
  locked,
  onToggle,
}: {
  locked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={locked}
      title={locked ? '고정됨 (클릭하면 잠금 해제)' : '고정 안 됨 (클릭하면 고정)'}
      className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
        locked
          ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
          : 'border-border bg-background text-muted-foreground hover:text-foreground'
      }`}
    >
      {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
    </button>
  );
}

function MinRoleSelect({
  value,
  disabled,
  onChange,
}: {
  value: AccessLevel;
  disabled?: boolean;
  onChange: (v: AccessLevel) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as AccessLevel)}
      className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-blue-500/50 disabled:opacity-40"
    >
      {LEVEL_OPTIONS.map((r) => (
        <option key={r} value={r}>
          {LEVEL_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

function DeleteButton({
  label,
  note,
  disabled,
  onConfirm,
}: {
  label: string;
  note?: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          title="삭제"
          disabled={disabled}
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-red-500/30 hover:text-red-500 disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
        >
          <Trash2 className="size-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>&ldquo;{label}&rdquo; 메뉴를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            {note ?? '이 작업은 되돌릴 수 없습니다.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-600/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type FormValues = CreateMenuInput;

function MenuFormDialog({
  state,
  groups,
  onClose,
}: {
  state: NonNullable<DialogState>;
  groups: MenuNode[];
  onClose: () => void;
}) {
  const create = useCreateMenu();
  const update = useUpdateMenu();
  const editing = state.mode === 'edit' ? state.node : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createMenuSchema),
    defaultValues: editing
      ? {
          title: editing.title,
          path: editing.path,
          icon: editing.icon ?? '',
          badge: editing.badge ?? '',
          type: editing.type,
          minRole: editing.minRole,
          parentId: editing.parentId ?? '',
          disabled: editing.disabled,
          hidden: editing.hidden,
        }
      : {
          title: '',
          path: '',
          icon: '',
          badge: '',
          type: 'LINK',
          minRole: 'FREE',
          parentId: state.mode === 'create' ? (state.parentId ?? '') : '',
          disabled: false,
          hidden: false,
        },
  });

  // 부모 후보 = FOLDER 대분류만(자기 자신 제외).
  const parentOptions = groups.filter(
    (g) => g.type === 'FOLDER' && g.id !== editing?.id,
  );

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      icon: values.icon ? values.icon : null,
      badge: values.badge ? values.badge : null,
      parentId: values.parentId ? values.parentId : null,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch {
      // 에러 토스트는 훅에서 처리. 다이얼로그 유지.
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? '메뉴 편집' : '메뉴 추가'}</DialogTitle>
          <DialogDescription>
            경로는 기존 라우트 전체 경로(예: /market/13f) 또는 팝업의 경우 외부
            URL(https://...)을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form
          id="menu-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <Field label="이름" error={errors.title?.message}>
            <Input {...register('title')} placeholder="메뉴 이름" />
          </Field>
          <Field label="경로" error={errors.path?.message}>
            <Input {...register('path')} placeholder="/market/13f" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="타입">
              <select
                {...register('type')}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-blue-500/50"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="상위 메뉴">
              <select
                {...register('parentId')}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-blue-500/50"
              >
                <option value="">대분류 (최상위)</option>
                {parentOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="아이콘">
              <select
                {...register('icon')}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-blue-500/50"
              >
                <option value="">없음</option>
                {MENU_ICON_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="접근 등급">
              <select
                {...register('minRole')}
                className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-blue-500/50"
              >
                {LEVEL_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {LEVEL_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="배지 (선택)">
            <Input {...register('badge')} placeholder="예: NEW" />
          </Field>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register('disabled')} className="size-4" />
              준비 중(비활성)
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register('hidden')} className="size-4" />
              사이드바 숨김
            </label>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="menu-form" disabled={isSubmitting}>
            {editing ? '저장' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
