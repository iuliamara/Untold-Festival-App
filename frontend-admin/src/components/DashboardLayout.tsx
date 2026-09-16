import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div style={styles.layoutWrapper}>
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Pane */}
      <div style={styles.contentPane}>
        {/* Unified Top Header Bar */}
        <Header />

        {/* Dynamic Nested Page Content with fade-in animation */}
        <main style={styles.pageBody} className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layoutWrapper: {
    display: 'flex',
    width: '100vw',
    minHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)',
  },
  contentPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  pageBody: {
    flex: 1,
    padding: '40px',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
};
