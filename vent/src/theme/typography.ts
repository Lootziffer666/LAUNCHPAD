export const typography = {
  fonts: {
    // Assuming a clear, adult Sans-Serif font (e.g. Inter or Roboto per the specs)
    fallback: 'System',
  },
  roles: {
    display: {
      lg: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      md: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
    },
    section: {
      title: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
    },
    card: {
      title: {
        lg: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
        md: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
        sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
      },
    },
    body: {
      lg: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
      sm: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
      strong: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
    },
    meta: {
      md: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
      sm: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    },
    numeric: {
      lg: { fontSize: 24, lineHeight: 28, fontWeight: '700' as const },
      md: { fontSize: 20, lineHeight: 24, fontWeight: '700' as const },
      sm: { fontSize: 16, lineHeight: 20, fontWeight: '700' as const },
    },
  },
};
