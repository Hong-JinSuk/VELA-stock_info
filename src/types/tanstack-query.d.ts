import '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      ignoreGlobalError?: boolean;
    };
    queryMeta: {
      ignoreGlobalError?: boolean; // QueryCache도 같은 방식으로 쓸 수 있게
    };
  }
}
