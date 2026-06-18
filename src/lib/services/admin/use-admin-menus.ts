import { api } from '@/lib/api/axios';
import type { CreateMenuInput, UpdateMenuInput } from '@/schemas/menu-schema';
import type { MenuNode } from '@/types/menu';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

const ADMIN_MENUS_KEY = ['admin-menus'] as const;

// 트리에서 id 노드에 부분 패치 적용(불변).
function patchTree(
  tree: MenuNode[],
  id: string,
  patch: Partial<MenuNode>,
): MenuNode[] {
  return tree.map((n) =>
    n.id === id
      ? { ...n, ...patch }
      : { ...n, children: patchTree(n.children, id, patch) },
  );
}

// 트리에서 id 노드 제거(불변).
function removeFromTree(tree: MenuNode[], id: string): MenuNode[] {
  return tree
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeFromTree(n.children, id) }));
}

export function useAdminMenus() {
  return useQuery({
    queryKey: ADMIN_MENUS_KEY,
    queryFn: async (): Promise<MenuNode[]> => {
      const { data } = await api.get<MenuNode[]>('/admin/menus');
      return data;
    },
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMenuInput) => {
      const { data } = await api.post('/admin/menus', input);
      return data;
    },
    onSuccess: () => {
      toast.success('메뉴가 추가되었습니다.');
      queryClient.invalidateQueries({ queryKey: ADMIN_MENUS_KEY });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    meta: { ignoreGlobalError: true },
    onError: (error: Error) => {
      toast.error(error.message || '메뉴 추가에 실패했습니다.');
    },
  });
}

// 낙관적 업데이트 + 롤백.
export function useUpdateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: UpdateMenuInput & { id: string }) => {
      const { data } = await api.patch(`/admin/menus/${id}`, patch);
      return data;
    },
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_MENUS_KEY });
      const previous = queryClient.getQueryData<MenuNode[]>(ADMIN_MENUS_KEY);
      queryClient.setQueryData<MenuNode[]>(ADMIN_MENUS_KEY, (tree) =>
        tree ? patchTree(tree, id, patch as Partial<MenuNode>) : tree,
      );
      return { previous };
    },
    onError: (error: Error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_MENUS_KEY, context.previous);
      }
      toast.error(error.message || '변경에 실패했습니다. 이전 상태로 되돌렸습니다.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MENUS_KEY });
    },
    meta: { ignoreGlobalError: true },
  });
}

// 낙관적 삭제 + 롤백.
export function useDeleteMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/menus/${id}`);
      return data;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_MENUS_KEY });
      const previous = queryClient.getQueryData<MenuNode[]>(ADMIN_MENUS_KEY);
      queryClient.setQueryData<MenuNode[]>(ADMIN_MENUS_KEY, (tree) =>
        tree ? removeFromTree(tree, id) : tree,
      );
      return { previous };
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_MENUS_KEY, context.previous);
      }
      toast.error(error.message || '삭제에 실패했습니다. 이전 상태로 되돌렸습니다.');
    },
    onSuccess: () => {
      toast.success('메뉴가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MENUS_KEY });
    },
    meta: { ignoreGlobalError: true },
  });
}
